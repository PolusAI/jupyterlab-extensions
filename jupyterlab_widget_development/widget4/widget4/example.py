#!/usr/bin/env python
# coding: utf-8

# Copyright (c) as.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

import os
from ipywidgets import DOMWidget
from traitlets import Unicode, Integer
from ._frontend import module_name, module_version


class ExampleWidget(DOMWidget):
    _model_name = Unicode('ExampleModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('ExampleView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
    imagePath = Unicode('').tag(sync=True)
    full_image_path = Unicode('').tag(sync=True)
    height = Integer(0).tag(sync=True)
    
    def __init__(self, imagePath='', height=0, **kwargs):
        super().__init__(**kwargs)

        notebook_dir = os.path.dirname(os.path.realpath(__name__))
        full_image_path = os.path.join(notebook_dir, imagePath)
        self.imagePath = imagePath
        self.height = height
        self.full_image_path = full_image_path
