import json
import os
import subprocess
import random
import string

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado


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
        # Not Cryptographically secure
        randomname = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=10)
        )
        tempenv = os.getenv("PLUGIN_TEMP_LOCATION")
        # if ENV exists
        if tempenv:
            os.chdir(tempenv)
            print(f"New directory {randomname} is created!")
        else:
            # if path doesn't exist
            if not os.path.isdir("temp"):
                print(f" creating ./temp in {os.getcwd()}... ")
                os.makedirs("temp")
            os.chdir("temp")
            print(
                f"Env variable PLUGIN_TEMP_LOCATION not found, creating new directory temp/{randomname}!"
            )
        os.makedirs(f"{randomname}")
        os.chdir(f"{randomname}")
        randomfolderpath = os.getcwd()
        print("Random folder name created: ", randomfolderpath)

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
            print("Error writing files: ", e)
            self.write_error(500)

        # Copy files to temp location
        # format cp Src_file1 Src_file2 Src_file3 Dest_directory
        try:
            if filepaths:
                os.chdir(pwd)
                cmds = ["cp"]
                for filepath in filepaths:
                    cmds.append(filepath)
                cmds.append(randomfolderpath)
                print(cmds)
                # Run the `cp file1 file2 file3 ./tempfolder` command
                copyfilescmd = subprocess.run(cmds)
                print("copy command return code: ", copyfilescmd.returncode)
        except Exception as e:
            print("error when running copy command", e)
        # change back to previous working dir
        os.chdir(pwd)


def setup_handlers(web_app):
    handlers = [("/jupyterlab-plugin-creator/createplugin", CreatePlugin)]

    base_url = web_app.settings["base_url"]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = ".*$"
    web_app.add_handlers(host_pattern, handlers)
