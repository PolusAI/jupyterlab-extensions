from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
import json

class WippHandler(APIHandler):
    @property
    def wipp(self):
        return self.settings["wipp"]


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
        self.finish(json.dumps({
            'root': self.wipp.wipp_ui_url,
            'notebooks': self.wipp.notebooks_ui_url,
            'imagescollections': self.wipp.imagescollections_ui_url,
            'imagescollection': self.wipp.imagescollection_ui_url,
            'csvcollections': self.wipp.csvcollections_ui_url
        }))


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
        if all(key in data for key in ("path","name","description")):
            try:
                response = self.wipp.register_notebook(data["path"], data["name"], data["description"])
                self.finish(json.dumps(response))
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
            response = self.wipp.get_image_collections()
            self.finish(json.dumps(response))
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
                response = self.wipp.search_image_collections(data["name"])
                self.finish(json.dumps(response))
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
            response = self.wipp.get_csv_collections()
            self.finish(json.dumps(response))
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
                response = self.wipp.search_csv_collections(data["name"])
                self.finish(json.dumps(response))
            except:
                self.write_error(500)
        else:
            self.write_error(400)


def setup_handlers(web_app):
    handlers = [
        ('/wipp/info', InfoCheckHandler),
        ('/wipp/ui_urls', WippUiUrls),
        ('/wipp/register', WippRegisterNotebook),
        ('/wipp/imageCollections', WippImageCollections),
        ('/wipp/imageCollections/search', WippImageCollectionsSearch),
        ('/wipp/csvCollections', WippCsvCollections),
        ('/wipp/csvCollections/search', WippCsvCollectionsSearch)
    ]

    base_url = web_app.settings["base_url"]
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = ".*$"
    web_app.add_handlers(host_pattern, handlers)
