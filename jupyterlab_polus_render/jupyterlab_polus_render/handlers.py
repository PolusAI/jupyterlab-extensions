import os
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.utils import url_path_join
import tornado
from tornado.web import StaticFileHandler

DEFAULT_STATIC_FILES_PATH = os.path.join(os.path.dirname(__file__), "render-ui")


class AuthFileHandler(JupyterHandler, StaticFileHandler):
    @tornado.web.authenticated
    def _initialize(self, path) -> None:
        StaticFileHandler._initialize(path)


def setup_handlers(web_app):
    base_url = web_app.settings["base_url"]
    handlers = [
        (
            url_path_join(base_url, "jupyterlab-polus-render", "image/(.+)"),
            AuthFileHandler,
            {"path": "/"},
        ),
        (
            url_path_join(base_url, "jupyterlab-polus-render", "render/(.*)"),
            StaticFileHandler,
            {"path": DEFAULT_STATIC_FILES_PATH},
        ),
    ]
    web_app.add_handlers(".*$", handlers)
