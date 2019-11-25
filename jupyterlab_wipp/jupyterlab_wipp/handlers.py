from notebook.base.handlers import APIHandler
from notebook.utils import url_path_join
import json


class WippHandler(APIHandler):
    @property
    def wipp(self):
        return self.settings["wipp"]


class InfoCheckHandler(WippHandler):
    def get(self):
        self.finish(json.dumps({
            'data': 'This is /wipp endpoint!'
        }))

class WippUiUrls(WippHandler):
    def get(self):
        self.finish(json.dumps({
            'root': self.wipp.wipp_ui_url,
            'notebooks': self.wipp.notebooks_ui_url,
            'imagescollections': self.wipp.imagescollections_ui_url,
            'imagescollection': self.wipp.imagescollection_ui_url,
            'csvcollections': self.wipp.csvcollections_ui_url
        }))


class WippRegisterNotebook(WippHandler):
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
        response = self.wipp.register_notebook(data["path"], data["name"], data["description"])
        
        self.finish(json.dumps(response))

class WippImageCollections(WippHandler):
    def get(self):
        """
        """
        response = self.wipp.get_image_collections()
        
        self.finish(json.dumps(response))

class WippImageCollectionsSearch(WippHandler):
    def post(self):
        """
        POST request handler, registers notebook in WIPP

        Input format:
            {
              'name': 'collection-abc',
            }
        """
        data = json.loads(self.request.body.decode("utf-8"))
        response = self.wipp.search_image_collections(data["name"])
        
        self.finish(json.dumps(response))

class WippCsvCollections(WippHandler):
    def get(self):
        """
        """
        response = self.wipp.get_csv_collections()
        
        self.finish(json.dumps(response))

class WippCsvCollectionsSearch(WippHandler):
    def post(self):
        """
        POST request handler, registers notebook in WIPP

        Input format:
            {
              'name': 'collection-abc',
            }
        """
        data = json.loads(self.request.body.decode("utf-8"))
        response = self.wipp.search_csv_collections(data["name"])
        
        self.finish(json.dumps(response))
        

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
    base_url = web_app.settings['base_url']
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = '.*$'
    web_app.add_handlers(host_pattern, handlers)