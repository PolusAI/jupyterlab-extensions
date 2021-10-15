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
    config.load_incluster_config() #Only works inside of JupyterLab Pod
    
    return client.CustomObjectsApi()

class WippHandler(APIHandler):
    @property
    def wipp(self):
        return self.settings["wipp-plugin-creator"]


# Create wipp plugin based on user input
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
                    'description': ''
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
            logger.info(f"PLUGIN_TEMP_PATH ENV variable exists; output path set to {pluginOutputPath}.")
            pluginOutputPath = os.path.join(pluginOutputPath, f"{randomId}")
            srcOutputPath = os.path.join(pluginOutputPath, "src")
            os.makedirs(pluginOutputPath)
            os.makedirs(srcOutputPath)
            logger.info(f"Random folder name created: {pluginOutputPath}.")

        else:
            logger.error("PLUGIN_TEMP_PATH ENV variable doesn't exist; please use command, export PLUGIN_TEMP_PATH='...' to set.")
            self.write_error(500)
            return

        # Read POST request
        data = json.loads(self.request.body.decode("utf-8"))
        form = data["formdata"]
        filepaths = data["addedfilepaths"]
        requirements = form["requirements"]

        # Separate requirements key in the formdata form rest to write plugin.json and requirements.txt separately
        form.pop("requirements")
        form["containerId"] = "polusai/generated-plugins:" + randomId

        # register plugin manifest to wipp CI
        self.wipp.register_plugin(form)
        logger.info("WIPP plugin register completed")
        
        # Get ../jupyterlab-extensions/jupyterlab_wipp_plugin_creator/jupyterlab_wipp_plugin_creator
        backendDirPath = os.path.dirname(os.path.realpath(__file__))
        templatePath = os.path.join(backendDirPath, "dockerfile.j2")
        reqsPath = os.path.join(srcOutputPath, "requirements.txt")
        manifestPath = os.path.join(pluginOutputPath, "plugin.json")
        dockerPath = os.path.join(pluginOutputPath, "Dockerfile")
        

        # Generate files to temp folder
        try:
            with open(manifestPath, "w") as f1:
                f1.write(json.dumps(form))
            with open(reqsPath, "w") as f2:
                for req in requirements:
                    f2.write(f"{req}\n")
            # Read from Jinja2 template
            template = Template(open(templatePath).read())

            # Generate dockerfile with user inputs, hardcoded for the time being
            template.stream(baseImage= "python").dump(dockerPath)
            logger.info(f"Dockerfile Template generated from jinja2 template, src/dockerfile.j2" )

        except Exception as e:
            logger.error(f"Error writing files", exc_info=e)
            self.write_error(500)
            return

        # Copy files to temp location with shutil
        # Copy2 is like copy but preserves metadata
        try:
            if filepaths:
                for filepath in filepaths:
                    filepath =  os.path.join(os.environ['HOME'], filepath)
                    copy2(filepath, srcOutputPath)
                logger.info("Copy command completed.")
            else:
                logger.error(f"No file to copy. Please right click on file and select 'Add to new WIPP plugin'.")
                self.write_error(500)
                return

        except Exception as e:
            logger.error(f"Error when running copy command.", exc_info=e)
            self.write_error(500)
            return

        # if disable build env variable was specified by the user, don't execute kubernetes commands to build the actual plugin

        if (os.getenv("WIPP_PLUGIN_CREATOR_DISABLE_BUILD")):
            logger.info("No Build mode ON. Environment is local. Plugin manifest(plugin.json) and dockerfile are generated but no images will be built. If the environment is a pod, please use 'export WIPP_PLUGIN_CREATOR_DISABLE_BUILD=1' to enable full functionality.")
        else:
            logger.info("No Build mode OFF. Environment is pod. Reading k8s cluster config... ")
            try: 
                api_instance = setup_k8s_api()
            except Exception as e:
                logger.error(f"Error when reading k8s config.", exc_info=e)
                self.write_error(500)
                return

            # Create Argojob to build container via Kubernetes Client
            logger.info(f"Beginning to run docker container via the Kubernetes Client.")

            # Global definition strings
            group = 'argoproj.io' # str | The custom resource's group name
            version = 'v1alpha1' # str | The custom resource's version
            namespace = 'default' # str | The custom resource's namespace
            plural = 'workflows' # str | The custom resource's plural name. For TPRs this would be lowercase plural kind.
            
            body = {
                "apiVersion": "argoproj.io/v1alpha1",
                "kind": "Workflow",
                "metadata": {
                    "generateName": f"build-polus-plugin-{randomId}-",
                },
                "spec": {
                    "entrypoint": "kaniko",
                    "volumes": [
                        {
                            "name": "kaniko-secret",
                            "secret": {
                                "secretName": "labshare-docker",
                                "items": [
                                    {
                                        "key": ".dockerconfigjson",
                                        "path": "config.json"
                                    }
                                ]
                            }
                        },
                        {
                            "name": "workdir",
                            "persistentVolumeClaim": {
                                "claimName": "wipp-pv-claim"
                            }
                        }
                    ],
                    "templates": [
                        {
                            "name": "kaniko",
                            "container": {
                                "image": "gcr.io/kaniko-project/executor:latest",
                                "args": [
                                f"--dockerfile=/workspace/Dockerfile",
                                "--context=dir:///workspace",
                                f"--destination=polusai/generated-plugins:{randomId}"
                                ],
                                "volumeMounts": [
                                    {
                                        "name": "kaniko-secret",
                                        "mountPath": "/kaniko/.docker",  
                                    },
                                    {
                                        "name": "workdir",
                                        "mountPath": "/workspace",
                                        "subPath": f"temp/plugins/{randomId}"
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
            try:
                api_response = api_instance.create_namespaced_custom_object(group, version, namespace, plural, body)
                logger.info(api_response)
            except ApiException as e:
                logger.error("Exception when starting to build container via Kubernetes Client: %s\n" % e)
                self.write_error(500)
                return


def setup_handlers(web_app):
    handlers = [("/jupyterlab_wipp_plugin_creator/createplugin", CreatePlugin)]

    base_url = web_app.settings["base_url"]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = ".*$"
    web_app.add_handlers(host_pattern, handlers)