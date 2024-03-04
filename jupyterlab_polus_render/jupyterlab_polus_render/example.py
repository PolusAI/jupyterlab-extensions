#!/usr/bin/env python
# coding: utf-8

"""
TODO: Add module docstring
"""

# import os
from pathlib import Path
from ipywidgets import DOMWidget
from traitlets import Unicode, Bool
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
    is_imagePath_url = Bool(False).tag(sync=True)  # Flag if the imagePath is a URL
    is_overlayPath_url = Bool(False).tag(sync=True) # Flag if the overlayPath is a URL
    
    def __init__(self, imagePath='', overlayPath='', **kwargs):
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
        
        self.imagePath = imagePath
        self.overlayPath = overlayPath

        self.full_image_path, self.is_imagePath_url = self.create_full_path(imagePath)
        self.full_overlay_path, self.is_overlayPath_url = self.create_full_path(overlayPath)


    def create_full_path(self, path):
        notebook_dir = Path.cwd()  # Get the current working directory

        # If the path starts with 'http', return path value and set True for URL flag
        if path.startswith('http'):
            return path, True 
        else:
            full_path = Path(path)  # Convert path to a Path object
            if not full_path.is_absolute():
                full_path = notebook_dir / path
                    
            # Raise FileNotFoundError if file does not exist             
            if not full_path.exists():
                raise FileNotFoundError(f"The file '{full_path}' does not exist.")
            
            return str(full_path), False
