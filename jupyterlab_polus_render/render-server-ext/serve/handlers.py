"""Jupyter server example handlers."""
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerJinjaMixin, ExtensionHandlerMixin
import tornado
from tornado.web import StaticFileHandler

class DefaultHandler(ExtensionHandlerMixin, JupyterHandler):
    """Default API handler."""

    @tornado.web.authenticated
    def get(self, path):
        self.write("<h1>render-server-ext</h1>")
        self.write("For usage and more, please click <a href=\"https://github.com/PolusAI/jupyterlab-extensions\">here</a>")

class AuthFileHandler(JupyterHandler, StaticFileHandler):

    def _initialize(self,path) -> None:
        StaticFileHandler._initialize(path)

    def set_default_headers(self):
        origin = self.request.headers.get('Origin')
        if origin and origin.endswith('ncats.io'):
            self.set_header('Access-Control-Allow-Origin', origin)
            self.set_header("Access-Control-Allow-Headers", "x-requested-with")
            self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')

    def options(self):
        # This is needed for the preflight request
        self.set_status(204)
        self.finish()


class BaseTemplateHandler(ExtensionHandlerJinjaMixin, ExtensionHandlerMixin, JupyterHandler):
    """The base template handler."""

    pass

class ErrorHandler(BaseTemplateHandler):
    """An error handler."""

    def get(self, path):
        """Write_error renders template from error.html file."""
        self.write_error(400)
