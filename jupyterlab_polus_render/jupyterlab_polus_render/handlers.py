import os
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.utils import url_path_join
import tornado
from tornado.web import StaticFileHandler


class ImageHandler(JupyterHandler, StaticFileHandler):
    @tornado.web.authenticated
    def _initialize(self, path) -> None:
        StaticFileHandler._initialize(path)


def setup_handlers(web_app):
    base_url = web_app.settings["base_url"]
    handlers = [
        (
            url_path_join(base_url, "jupyterlab-polus-render", "image/(.+)"),
            ImageHandler,
            {"path": "/"},
        )
    ]
    web_app.add_handlers(".*$", handlers)
