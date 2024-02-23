#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Akshat Saini, Jeff Chen.
# Distributed under the terms of the Modified BSD License.

from .example import Render
from ._version import __version__, version_info
import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

class RouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jupyterlab-polus-render/hello endpoint!"
        }))


def setup_handlers(web_app):
    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jupyterlab-polus-render", "hello")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(".*$", handlers)

def _jupyter_labextension_paths():
    """Called by Jupyter Lab Server to detect if it is a valid labextension and
    to install the widget
    Returns
    =======
    src: Source directory name to copy files from. Webpack outputs generated files
        into this directory and Jupyter Lab copies from this directory during
        widget installation
    dest: Destination directory name to install widget files to. Jupyter Lab copies
        from `src` directory into <jupyter path>/labextensions/<dest> directory
        during widget installation
    """
    return [{
        'src': 'labextension',
        'dest': 'jupyterlab_polus_render',
    }]


def _jupyter_nbextension_paths():
    """Called by Jupyter Notebook Server to detect if it is a valid nbextension and
    to install the widget
    Returns
    =======
    section: The section of the Jupyter Notebook Server to change.
        Must be 'notebook' for widget extensions
    src: Source directory name to copy files from. Webpack outputs generated files
        into this directory and Jupyter Notebook copies from this directory during
        widget installation
    dest: Destination directory name to install widget files to. Jupyter Notebook copies
        from `src` directory into <jupyter path>/nbextensions/<dest> directory
        during widget installation
    require: Path to importable AMD Javascript module inside the
        <jupyter path>/nbextensions/<dest> directory
    """
    return [{
        'section': 'notebook',
        'src': 'nbextension',
        'dest': 'jupyterlab_polus_render',
        'require': 'jupyterlab_polus_render/extension'
    }]

def _jupyter_server_extension_points():
    return [{
        "module": "jupyterlab_polus_render"
    }]

def _load_jupyter_server_extension(server_app):
    setup_handlers(server_app.web_app)
    name = "jupyterlab_polus_render"
    server_app.log.info(f"!!!!!!!! Registered {name} server extension")