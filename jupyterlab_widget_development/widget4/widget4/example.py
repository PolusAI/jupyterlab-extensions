#!/usr/bin/env python
# coding: utf-8

# Copyright (c) as.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

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
    imageUrl = Unicode('').tag(sync=True)
    height = Integer(0).tag(sync=True)

    def __init__(self, imageUrl='', height='', **kwargs):
        super().__init__(**kwargs)
        self.imageUrl = imageUrl
        self.height = height

