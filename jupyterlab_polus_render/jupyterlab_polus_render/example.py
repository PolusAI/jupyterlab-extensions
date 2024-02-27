#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Akshat Saini, Jeff Chen.
# Distributed under the terms of the Modified BSD License.

"""
TODO: Add module docstring
"""

# import os
from pathlib import Path
from ipywidgets import DOMWidget
from traitlets import Unicode, Integer
from ._frontend import module_name, module_version


class Render(DOMWidget):
    _model_name = Unicode('ExampleModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('ExampleView').tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)
    imagePath = Unicode('').tag(sync=True)
    full_image_path = Unicode('').tag(sync=True)
    overlayPath = Unicode('').tag(sync=True)
    full_overlay_path = Unicode('').tag(sync=True)
    height = Integer(900).tag(sync=True)
    
    def __init__(self, imagePath='', overlayPath='', height=900, **kwargs):
        super().__init__(**kwargs)

# Commented code below uses OS module to grab system path and perform checks
        
        # notebook_dir = os.path.dirname(os.path.realpath(__name__))
        # self.imagePath = imagePath
        # self.height = height
        # full_image_path = imagePath
        # # Check for sys path or relative path
        # if os.path.isabs(imagePath):
        #     full_image_path = imagePath
        # else:   
        #     full_image_path = os.path.join(notebook_dir, imagePath)
        # self.full_image_path = full_image_path

# Below uses pathlib module
        
        notebook_dir = Path.cwd() # Get the current working directory
        self.imagePath = imagePath
        self.overlayPath = overlayPath
        self.height = height
        # If imagePath starts with 'http', set full_image_path to imagePath
        if imagePath.startswith('http'):
            self.full_image_path = imagePath
        else:
            full_image_path = Path(imagePath) # Convert imagePath to a Path object
            if not full_image_path.is_absolute():
                full_image_path = notebook_dir / imagePath 
            self.full_image_path = str(full_image_path) # Convert to string object
        # Overlays are stored locally and dont have url clause
        full_overlay_path = Path(overlayPath)
        if not full_overlay_path.is_absolute():
            full_overlay_path = notebook_dir / overlayPath
        self.full_overlay_path = str(full_overlay_path)
        