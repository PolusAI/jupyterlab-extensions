#!/usr/bin/env python
# coding: utf-8

"""
This module defines a `Render` class, which is a subclass of `DOMWidget` from ipywidgets. The `Render` widget 
allows users to open images in Polus Render extension with options to specify file paths either locally or via remote URL.

Attributes:
    - imagePath (str): The path to the image file or remote URL entered by user.
    - overlayPath (str): The path to the overlay file or remote URL entered by user.
    - full_image_path (str): The absolute path to the image file.
    - full_overlay_path (str): The absolute path to the overlay file.
    - is_imagePath_url (bool): A flag indicating whether the imagePath is a URL.
    - is_overlayPath_url (bool): A flag indicating whether the overlayPath is a URL.

Methods:
    - create_full_path: creates the absolute path for a given file path. Handles both local and remote URL paths.
"""

# import os
from pathlib import Path
from ipywidgets import DOMWidget
from traitlets import Unicode, Bool
from ._frontend import module_name, module_version


class Render(DOMWidget):
    _model_name = Unicode('RenderModel').tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode('RenderView').tag(sync=True)
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
        
        self.imagePath = imagePath
        self.overlayPath = overlayPath

        self.full_image_path, self.is_imagePath_url = self.create_full_path(imagePath)
        self.full_overlay_path, self.is_overlayPath_url = self.create_full_path(overlayPath)


    def create_full_path(self, path):
        # If the path starts with 'http', return path value and set True for URL flag
        if path.startswith('http'):
            return path, True 
        else:
            full_path = Path(path)  # Convert path to a Path object
            if not full_path.is_absolute():
                notebook_dir = Path.cwd()  # Get the current working directory
                full_path = notebook_dir / path
                    
            # Raise FileNotFoundError if file does not exist             
            if not full_path.exists():
                raise FileNotFoundError(f"The file '{full_path}' does not exist.")
            
            return str(full_path), False
        