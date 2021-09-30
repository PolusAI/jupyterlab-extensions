import json
import os

from shutil import copy2
from wipp_client.wipp import gen_random_object_id

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from .log import get_logger
import tornado

from jinja2 import Template

logger = get_logger()
# logger.setLevel(logging.INFO)

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

        pwd = os.getcwd()

        # Random ID follows MongoDB format
        randomId = gen_random_object_id()

        pluginOutputPath = os.getenv("PLUGIN_TEMP_LOCATION")
        # if ENV exists
        if pluginOutputPath:
            os.chdir(pluginOutputPath)
            logger.info(f"ENV variable exists, output path set to {pluginOutputPath}.")
            os.makedirs(f"{randomId}")
            os.chdir(f"{randomId}")
            pluginOutputPath = os.getcwd()
            logger.info("Random folder name created: ", pluginOutputPath)

        else:
            logger.error("ENV variable doesn't exist, please use command 'export PLUGIN_TEMP_LOCATION = '...' to set. Terminating..")
            quit()

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

        # Generate files to temp folder
        try:
            with open("plugin.json", "w") as f1:
                f1.write(json.dumps(form))
            with open("requirements.txt", "w") as f2:
                for req in requirements:
                    f2.write(f"{req}\n")
            os.chdir(pwd + '/jupyterlab_wipp_plugin_creator')
            template = Template(open('dockerfile.j2').read())
            template.stream(userImage= "python").dump(pluginOutputPath + '/Dockerfile')
            logger.info(f"Dockerfile Template generated from jinja2 template, src/dockerfile.j2" )


        except Exception as e:
            logger.error(f"Error writing files", exc_info=e)
            # when error change back to root working dir
            os.chdir(pwd)
            self.write_error(500)

        # Copy files to temp location with shutil
        # Copy2 is like copy but preserves metadata
        try:
            if filepaths:
                os.chdir(pwd)
                for filepath in filepaths:
                    copy2(filepath, pluginOutputPath)
                logger.info(f"Copy command completed")
            else:
                logger.error(f"No file to copy. Please right click on file and select 'Add to new WIPP plugin'.")

        except Exception as e:
            logger.error(f"Error when running copy command.", exc_info=e)
            os.chdir(pwd)

       


def setup_handlers(web_app):
    handlers = [("/jupyterlab_wipp_plugin_creator/createplugin", CreatePlugin)]

    base_url = web_app.settings["base_url"]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = ".*$"
    web_app.add_handlers(host_pattern, handlers)
