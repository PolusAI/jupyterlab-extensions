"""Jupyter server example handlers."""
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerJinjaMixin, ExtensionHandlerMixin
import tornado
from tornado.web import StaticFileHandler

class DefaultHandler(ExtensionHandlerMixin, JupyterHandler):
    """Default API handler."""

    @tornado.web.authenticated
    def get(self, path):
        self.write("<h1>polus-server-ext</h1>")
        self.write("For usage and more, please click <a href=\"https://github.com/jcaxle/polus-server-ext\">here</a>")

class AuthFileHandler(JupyterHandler, StaticFileHandler):

    def _initialize(self,path) -> None:
        StaticFileHandler._initialize(path)


class BaseTemplateHandler(ExtensionHandlerJinjaMixin, ExtensionHandlerMixin, JupyterHandler):
    """The base template handler."""

    pass

class ErrorHandler(BaseTemplateHandler):
    """An error handler."""

    def get(self, path):
        """Write_error renders template from error.html file."""
        self.write_error(400)
