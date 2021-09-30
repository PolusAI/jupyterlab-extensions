import json
import os

from shutil import copy2
import random
import string
from wipp_client.wipp import gen_random_object_id

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
# import logging
from .log import get_logger

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
        randomname= gen_random_object_id()

        pluginOutputPath = os.getenv("PLUGIN_TEMP_LOCATION")
        # if ENV exists
        if pluginOutputPath:
            os.chdir(pluginOutputPath)
            logger.info(f"ENV variable exists, output path set to {pluginOutputPath}.")
            os.makedirs(f"{randomname}")
            os.chdir(f"{randomname}")
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
        form["containerId"] = "polusai/generated-plugins:" + randomname

        # register plugin manifest to wipp CI
        self.wipp.register_plugin(form)

        # Generate files to temp folder
        try:
            with open("plugin.json", "w") as f1:
                f1.write(json.dumps(form))
            with open("requirements.txt", "w") as f2:
                for req in requirements:
                    f2.write(f"{req}\n")
            with open("Dockerfile", "w") as f3:
                # writelines only accept a sequence, str[]
                # \\\n\ first two \\ are escape plus single \ needed in docker file, \n new line and then 4th backslash
                # for the python inline line continuation, hence the ugly indent is necessary for correctly formatting dockerfile
                f3.writelines(
                    [
                        f"FROM python",
                        "\n",
                        "COPY VERSION /\n",
                        "\n",
                        'ARG EXEC_DIR="/opt/executables"\n',
                        'ARG DATA_DIR="/data"\n',
                        "RUN mkdir -p ${EXEC_DIR} \\\n\
    && mkdir -p ${DATA_DIR}/inputs \\\n\
    && mkdir ${DATA_DIR}/outputs\n\n",
                        "COPY src ${EXEC_DIR}/\n",
                        "RUN pip3 install -r requirements.txt --no-cache-dir\n\n",
                        "WORKDIR ${EXEC_DIR}\n\n",
                        f'ENTRYPOINT \["python3", "main.py"\]',
                    ]
                )

        except Exception as e:
            logger.error(f"Error writing files.", exc_info=e)
            self.write_error(500)

        # Copy files to temp location with shutil
        # Copy2 is like copy but preserves metadata
        try:
            if filepaths:
                os.chdir(pwd)
                for filepath in filepaths:
                    copy2(filepath, pluginOutputPath)
                logger.info(f"Copy command completed")

        except Exception as e:
            logger.error(f"Error when running copy command.", exc_info=e)
        # change back to previous working dir
        os.chdir(pwd)


def setup_handlers(web_app):
    handlers = [("/jupyterlab_wipp_plugin_creator/createplugin", CreatePlugin)]

    base_url = web_app.settings["base_url"]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = ".*$"
    web_app.add_handlers(host_pattern, handlers)
