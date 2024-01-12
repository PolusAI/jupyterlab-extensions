#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Jeff Chen, Akshat Saini.
# Distributed under the terms of the Modified BSD License.

from .example import ExampleWidget
from ._version import __version__, version_info
from .application import Application


# Sets server activation ID and the app itself, called from jupyter server --ServerApp.jpserver_extensions="{'simple_ext1': True}"
def _jupyter_server_extension_points():
    return [{"module": "serve.application", "app": Application}]


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
        'dest': 'jupyterlab-polus-render',
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
        'dest': 'jupyterlab-polus-render',
        'require': 'jupyterlab-polus-render/extension'
    }]
