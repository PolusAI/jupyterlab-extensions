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
        response = self.wipp.get_image_collections_all_pages()
        self.finish(json.dumps(response))
        

def setup_handlers(web_app):
    handlers = [
        ('/wipp/info', InfoCheckHandler),
        ('/wipp/register', WippRegisterNotebook),
        ('/wipp/imageCollections', WippImageCollections)
    ]
    base_url = web_app.settings['base_url']
    handlers = [(url_path_join(base_url, x[0]), x[1]) for x in handlers]

    host_pattern = '.*$'
    web_app.add_handlers(host_pattern, handlers)