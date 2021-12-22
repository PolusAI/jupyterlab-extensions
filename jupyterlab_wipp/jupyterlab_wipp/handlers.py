import os
import json
import shutil
import binascii
import requests
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado


def gen_random_object_id():
    """
    Generate random ObjectID in MongoDB format
    """
    timestamp = "{0:x}".format(int(time.time()))
    rest = binascii.b2a_hex(os.urandom(8)).decode("ascii")
    return timestamp + rest


class WippHandler(APIHandler):
    @property
    def wipp(self):
        return self.settings["wipp"]

    @property
    def urls(self):
        return self.settings["wipp_urls"]


class InfoCheckHandler(WippHandler):
    @tornado.web.authenticated
    def get(self):
        response = self.wipp.check_api_is_live()
        self.finish(json.dumps(response))


class WippUiUrls(WippHandler):
    @tornado.web.authenticated
    def get(self):
        """
        GET request handler, returns relevant WIPP UI URLs
        """
        self.finish(
            json.dumps(
                {
                    "notebooks": self.urls["notebooks_ui_url"],
                    "imagescollections": self.urls["imagescollections_ui_url"],
                    "imagescollection": self.urls["imagescollection_ui_url"],
                    "csvcollections": self.urls["csvcollections_ui_url"],
                }
            )
        )


class WippRegisterNotebook(WippHandler):
    @tornado.web.authenticated
    def post(self):
        """
        POST request handler, registers notebook in WIPP

        Input format:
            {
              'path': '/home/jovyan/sample.ipynb',
              'name': 'my-notebook-7',
              'description': 'Image segmentation notebook'
            }
        """

        data = json.loads(self.request.body.decode("utf-8"))
        temp_notebooks_path = (
            os.getenv("WIPP_NOTEBOOKS_PATH")
            if "WIPP_NOTEBOOKS_PATH" in os.environ
            else "/opt/shared/wipp/temp/notebooks"
        )

        if all(key in data for key in ("path", "name", "description")):
            try:
                api_route = (
                    os.getenv("WIPP_API_INTERNAL_URL")
                    if "WIPP_API_INTERNAL_URL" in os.environ
                    else "http://wipp-backend:8080/api"
                )
                notebooks_api_route = os.path.join(api_route, "notebooks")

                # Append default path
                notebook_path = os.path.join(os.environ["HOME"], data["path"])

                # Generate random ObjectID for notebook
                object_id = gen_random_object_id()

                # Create destination folder in WIPP
                dest_folder = os.path.join(temp_notebooks_path, object_id)
                if not os.path.exists(dest_folder):
                    os.makedirs(dest_folder)

                # Copy notebook to destination folder in WIPP
                dest_path = os.path.join(dest_folder, "notebook.ipynb")
                shutil.copy(notebook_path, dest_path)

                # Send API request to WIPP to register notebook
                url = os.path.join(notebooks_api_route, "import")
                querystring = {
                    "folderName": object_id,
                    "name": data["name"],
                    "description": data["description"],
                }
                response = requests.request("POST", url, params=querystring)

                result = {"code": response.status_code}
                if response.status_code == 200:
                    response_json = response.json()

                    # Append workflow URL information
                    response_json["url"] = self.notebooks_ui_url

                    result["info"] = response_json
                elif response.status_code == 400:
                    result["error"] = response.text

                self.finish(json.dumps(result))
            except:
                self.write_error(500)
        else:
            self.write_error(400)


class WippImageCollections(WippHandler):
    @tornado.web.authenticated
    def get(self):
        """
        GET request handler, returns an array of WIPP Image Collections
        """

        try:
            response = [
                collection.dict(by_alias=True)
                for collection in self.wipp.get_image_collections()
            ]

            self.finish(json.dumps(response, default=str))
        except:
            self.write_error(500)


class WippImageCollectionsSearch(WippHandler):
    @tornado.web.authenticated
    def post(self):
        """
        POST request handler
        Returns an array of WIPP Image Collection which have requested string in the name

        Input format:
            {
              'name': 'collection-abc',
            }
        """

        data = json.loads(self.request.body.decode("utf-8"))
        if "name" in data.keys():
            try:
                response = [
                    collection.dict(by_alias=True)
                    for collection in self.wipp.search_image_collections(data["name"])
                ]
                self.finish(json.dumps(response, default=str))
            except:
                self.write_error(500)
        else:
            self.write_error(400)


class WippCsvCollections(WippHandler):
    @tornado.web.authenticated
    def get(self):
        """
        GET request handler, returns an array of WIPP Csv Collections
        """
        try:
            response = [
                collection.dict(by_alias=True)
                for collection in self.wipp.get_csv_collections()
            ]

            self.finish(json.dumps(response, default=str))
        except:
            self.write(500)


class WippCsvCollectionsSearch(WippHandler):
    @tornado.web.authenticated
    def post(self):
        """
        POST request handler
        Returns an array of WIPP Csv Collection which have requested string in the name

        Input format:
            {
              'name': 'collection-abc',
            }
        """

        data = json.loads(self.request.body.decode("utf-8"))
        if "name" in data.keys():
            try:
                response = [
                    collection.dict(by_alias=True)
                    for collection in self.wipp.search_csv_collections(data["name"])
                ]
                self.finish(json.dumps(response, default=str))
            except:
                self.write_error(500)
        else:
            self.write_error(400)


def setup_handlers(web_app):
    handlers = [
        ("/wipp/info", InfoCheckHandler),
        ("/wipp/ui_urls", WippUiUrls),
        ("/wipp/register", WippRegisterNotebook),
        ("/wipp/imageCollections", WippImageCollections),
        ("/wipp/imageCollections/search", WippImageCollectionsSearch),
        ("/wipp/csvCollections", WippCsvCollections),
        ("/wipp/csvCollections/search", WippCsvCollectionsSearch),
    ]

    base_url = web_app.settings["base_url"]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = ".*$"
    web_app.add_handlers(host_pattern, handlers)
