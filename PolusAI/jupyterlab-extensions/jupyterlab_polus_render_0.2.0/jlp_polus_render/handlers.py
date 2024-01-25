"""Jupyter server example handlers."""
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.extension.handler import ExtensionHandlerJinjaMixin, ExtensionHandlerMixin
import tornado
from tornado.web import StaticFileHandler
import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

class DefaultHandler(ExtensionHandlerMixin, JupyterHandler):
    """Default API handler."""

    @tornado.web.authenticated
    def get(self, path):
        self.write("<h1>render-server-ext</h1>")
        self.write("For usage and more, please click <a href=\"https://github.com/PolusAI/jupyterlab-extensions\">here</a>")

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


class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jlp-polus-render/get-example endpoint!"
        }))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jlp-polus-render", "get-example")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)