import json
import os
from shutil import copy2

from kubernetes import client, config
from kubernetes.client.rest import ApiException
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from jinja2 import Template
import tornado

from wipp_client.wipp import gen_random_object_id
from .log import get_logger

logger = get_logger()


def setup_k8s_api():
    """
    Common actions to setup Kubernetes API access to Argo workflows
    """
    config.load_incluster_config()  # Only works inside of JupyterLab Pod

    return client.CustomObjectsApi()


class WippHandler(APIHandler):
    @property
    def wipp(self):
        return self.settings["wipp-plugin-creator"]


# Create WIPP plugin based on user input
class CreatePlugin(WippHandler):
    @tornado.web.authenticated
    def post(self):
        """
        POST request handler,

        Creates a temp folder with random name,
        Generates plugin.json, requirements.txt, dockerfile,
        Copies files
        Builds dockerimage,

        Input format:
            {
                'formdata':
                    {
                    'name': '',
                    'version': '',
                    'title': '',
                    'description': '',
                    'author': '',
                    'institution': '',
                    'repository': '',
                    'website': '',
                    'citation': '',
                    'requirements': [''],
                    'inputs': [{}],
                    'outputs': [{}],
                    'baseImage': ''
                    }
                'filepaths':
                    string[]
            }

        """

        # Random ID follows MongoDB format
        randomId = gen_random_object_id()

        pluginOutputPath = os.getenv("PLUGIN_TEMP_PATH")
        # if PLUGIN_TEMP_PATH ENV exists
        if pluginOutputPath:
            logger.info(
                f"PLUGIN_TEMP_PATH ENV variable exists; output path set to {pluginOutputPath}."
            )
            pluginOutputPath = os.path.join(pluginOutputPath, f"{randomId}")
            srcOutputPath = os.path.join(pluginOutputPath, "src")
            os.makedirs(pluginOutputPath)
            os.makedirs(srcOutputPath)
            logger.info(f"Random folder name created: {pluginOutputPath}.")

        else:
            logger.error(
                "PLUGIN_TEMP_PATH ENV variable doesn't exist; please use command, export PLUGIN_TEMP_PATH='...' to set."
            )
            self.write_error(500)
            return

        # Read POST request
        data = json.loads(self.request.body.decode("utf-8"))
        # data contains 'formdata' and separately 'addedfilepaths'
        form = data["formdata"]

        filepaths = data.get("addedfilepaths", [])

        if "requirements" in form.keys():
            requirements = form["requirements"]
            # Remove requirements from form which will be written as plugin.json and write requirements.txt separately
            form.pop("requirements")
        else:
            requirements = []

        if "baseImage" in form.keys():
            baseImage = form["baseImage"]
            # Same as above. Avoid baseImage from being written to the plugin manifest
            form.pop("baseImage")
        else:
            baseImage = "python"

        # Generate 'containerId' key to publish plugin, used as the name of the plugin to be generated
        form["containerId"] = "polusai/generated-plugins:" + randomId

        # Generate 'ui' key based on user entered input dir, used by WIPP frontend
        uiList = []
        if form["inputs"]:
            for inp in form["inputs"]:
                # title is set to input name as well
                try:
                    uiKeyObj = {
                        "key": f"inputs.{inp['name']}",
                        "title": inp["name"],
                        "description": inp["description"],
                    }
                    uiList.append(uiKeyObj)
                except Exception as e:
                    logger.error("Potential malformed inputs.", exc_info=e)
                    self.write_error(500)
                    return
        form["ui"] = uiList

        # register plugin manifest to WIPP CI
        # if disable register env variable = 1 was specified by the user, don't register plugin in WIPP backend.
        if os.getenv("WIPP_PLUGIN_CREATOR_DISABLE_REGISTER") == "1":
            logger.info(
                "No register mode ON. Plugin won't be registered in WIPP backend. Use 'export WIPP_PLUGIN_CREATOR_DISABLE_REGISTER=0' to enable automatic WIPP backend register."
            )
        else:
            try:
                self.wipp.register_plugin(form)
                logger.info("WIPP plugin registered!")
            except Exception as e:
                logger.error("WIPP plugin register failed,", exc_info=e)
                self.write_error(500)
                return
        # Get ../jupyterlab-extensions/jupyterlab_wipp_plugin_creator/jupyterlab_wipp_plugin_creator
        backendDirPath = os.path.dirname(os.path.realpath(__file__))
        templatePath = os.path.join(backendDirPath, "dockerfile.j2")
        reqsPath = os.path.join(srcOutputPath, "requirements.txt")
        manifestPath = os.path.join(pluginOutputPath, "plugin.json")
        dockerPath = os.path.join(pluginOutputPath, "Dockerfile")

        # Generate plugin.json, aka. plugin manifest to temp folder
        try:
            with open(manifestPath, "w") as f1:
                f1.write(json.dumps(form))
            with open(reqsPath, "w") as f2:
                # join will write "" if list is empty
                f2.write("\n".join(requirements))
            # Read from Jinja2 template
            template = Template(open(templatePath).read())

            # Generate dockerfile with user inputs, hardcoded for the time being
            template.stream(baseImage=baseImage).dump(dockerPath)
            logger.info(
                f"Dockerfile Template generated from jinja2 template, src/dockerfile.j2"
            )

        except Exception as e:
            logger.error(f"Error writing files", exc_info=e)
            self.write_error(500)
            return

        # Copy files to temp location with shutil
        # Copy2 is like copy but preserves metadata
        try:
            if filepaths:
                # dedupe if the user select same code in two ways(via right click context and file manager), even though this should have been handled by frontend
                filepaths = list(set(filepaths))
                for filepath in filepaths:
                    filepath = os.path.join(os.environ["HOME"], filepath)
                    copy2(filepath, srcOutputPath)
                logger.info("Copy command completed.")
            else:
                logger.error(
                    f"No file to copy. Please right click on file and select 'Add to new WIPP plugin'."
                )
                self.write_error(500)
                return

        except Exception as e:
            logger.error(f"Error when running copy command.", exc_info=e)
            self.write_error(500)
            return

        # do not build the container if build was disabled by the user
        if os.getenv("WIPP_PLUGIN_CREATOR_DISABLE_BUILD") == "1":
            logger.info(
                "The Docker image build using Argo is disabled. Plugin manifest(plugin.json) and Dockerfile will be generated but no images will be built. "
                + "To enable the build, please use 'export WIPP_PLUGIN_CREATOR_DISABLE_BUILD=0'"
            )
        else:
            logger.info("Reading k8s cluster config...")
            try:
                api_instance = setup_k8s_api()
            except Exception as e:
                logger.error(f"Error when reading k8s config.", exc_info=e)
                self.write_error(500)
                return

            # Create Argojob to build container via Kubernetes Client
            logger.info(f"Beginning to run docker container via the Kubernetes Client.")

            # Global definition strings
            group = "argoproj.io"  # str | The custom resource's group name
            version = "v1alpha1"  # str | The custom resource's version
            namespace = "default"  # str | The custom resource's namespace
            plural = "workflows"  # str | The custom resource's plural name. For TPRs this would be lowercase plural kind.

            body = {
                "apiVersion": "argoproj.io/v1alpha1",
                "kind": "Workflow",
                "metadata": {"generateName": f"build-polus-plugin-{randomId}-",},
                "spec": {
                    "entrypoint": "kaniko",
                    "volumes": [
                        {
                            "name": "kaniko-secret",
                            "secret": {
                                "secretName": "labshare-docker",
                                "items": [
                                    {"key": ".dockerconfigjson", "path": "config.json"}
                                ],
                            },
                        },
                        {
                            "name": "workdir",
                            "persistentVolumeClaim": {"claimName": "wipp-pv-claim"},
                        },
                    ],
                    "templates": [
                        {
                            "name": "kaniko",
                            "container": {
                                "image": "gcr.io/kaniko-project/executor:latest",
                                "args": [
                                    f"--dockerfile=/workspace/Dockerfile",
                                    "--context=dir:///workspace",
                                    f"--destination=polusai/generated-plugins:{randomId}",
                                ],
                                "volumeMounts": [
                                    {
                                        "name": "kaniko-secret",
                                        "mountPath": "/kaniko/.docker",
                                    },
                                    {
                                        "name": "workdir",
                                        "mountPath": "/workspace",
                                        "subPath": f"temp/plugins/{randomId}",
                                    },
                                ],
                            },
                        }
                    ],
                },
            }
            try:
                api_response = api_instance.create_namespaced_custom_object(
                    group, version, namespace, plural, body
                )
                logger.info(api_response)
            except ApiException as e:
                logger.error(
                    "Exception when starting to build container via Kubernetes Client: %s\n"
                    % e
                )
                self.write_error(500)
                return


def setup_handlers(web_app):
    handlers = [("/jupyterlab_wipp_plugin_creator/createplugin", CreatePlugin)]

    base_url = web_app.settings["base_url"]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = ".*$"
    web_app.add_handlers(host_pattern, handlers)
