# JupyterLab Polus Render
JupyterLab Polus Render makes Polus Render available as a JupyterLab extension. 

Polus Render allows visualizing tiled raster datasets in Zarr and TIFF formats, as well as vector overlays in MicroJSON format. It uses lookup tables to map intensity values in these datasets to colors.

The are three ways to load the data:
1. Specifying a URL to a server serving the data.
2. Specifying a local path to a file from JupyterLab.
3. Dragging-and-dropping the dataset does not use a server.
</br>

Please note that usage differs significantly from https://pypi.org/project/polus-render/0.0.4.0.1.5/

<img src="images/home.png"/>

# Requirements
* Python 3.9+

# Installation
```
pip install "git+https://github.com/PolusAI/jupyterlab-extensions.git#egg=jupyterlab_polus_render&subdirectory=jupyterlab_polus_render"
```
You will need to restart Jupyter Server for `render-server-ext` endpoints to take effect.

# Project File Structure
```
jupyterlab_polus_render
| LICENSE
| requirements.txt
| MANIFEST.in                     // Packaging entries
| pyproject.toml                  // Pypi config 
| README                          
└───render-server-ext             // Server extension used by jupyterlab_polus_render
└───polus
    | polus_render.py             // Main file, contains render function used by user
```

# Build Instructions
- cd to `jupyterlab_polus_render` root directory.
- `py -m build`
- `py -m twine upload  dist/*`
- Enter `__token__` as user and reference API keys for password

## NOTE:
- For each upload, version number must be changed in `pyproject.toml`
- Add additional files to `MANIFEST.in` to bundle them with Pypi package

# Render: Static build functionality
JupyterLab Polus Render is bundled with a build of Polus Render which supporting the following functionality
| Version           | Zarr from URL/Path | TIF from URL/Path   | Micro-JSON Support | Zarr/TIF Drag & Drop | Micro-JSON Drag & Drop | 
|----------------|---------------|---------------|----------------|-----------|-----|
| Static | :heavy_check_mark:  | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark:

# Drag & Drop Demo
<img src="images/drag-drop.gif"/>

# Sample usage
``` Python
from polus.polus_render import render

# pathlib and urllib are built-ins
from urllib.parse import urlparse
from pathlib import Path

# Make sure to keep track of your JupyterLab url and file root if your root is not at "/home/joyvan".
JL_URL = urlparse("https://<JUPYTERHUB_URL>/user/<USERNAME>/user-namespaces/lab?")

# Embeds an IFrame of a static build of Polus Render into Jupyter Lab, this is sufficient if your file root is "/home/joyvan/"
render(nbhub_url=JL_URL)

# Same as above; however, if your file root is "/Users/jeff.chen/", your invocation will require nb_root argument
render(nbhub_url=JL_URL, \
    nb_root=Path("/Users/jeff.chen/"))

# Embeds an IFrame of a static build of Polus Render with an image file hosted at "https://viv-demo.storage.googleapis.com/LuCa-7color_Scan1/"
render(nbhub_url=JL_URL, \
    image_location=urlparse("https://viv-demo.storage.googleapis.com/LuCa-7color_Scan1/"))

# Embeds an IFrame of a static build of Polus Render with an image hosted at "/home/joyvan/zarr files/pyramid.zarr"
render(nbhub_url=JL_URL, \
    image_location=Path(r"zarr files/pyramid.zarr"))

# Embeds an IFrame of a static build of Polus Render with an image and overlay file
render(nbhub_url=JL_URL, \
    image_location=Path("zarr files/pyramid.zarr"), \
    microjson_overlay_location=Path("overlay files/x00_y01_c1_segmentations.json"))

# Embeds an IFrame of a static build of Polus Render with an image and overlay file served online
render(nbhub_url=JL_URL, \
    image_location=urlparse("https://files.scb-ncats.io/pyramids/segmentations/x00_y01_c1.ome.tif"), \
    microjson_overlay_location=urlparse("https://files.scb-ncats.io/pyramids/segmentations/x00_y03_c1_segmentations.json"))
```

# Functions
``` Python
def render(nbhub_url:ParseResult, nb_root:PurePath = Path("/home/jovyan/"), image_location:Union[ParseResult, PurePath] = "", microjson_overlay_location:Union[ParseResult, PurePath] = "", width:int=960, height:int=500)->str:
    """
    Embeds a static build of render into a JupyterLabs notebook with the help of `render-server-ext`

    Param:
        nbhub_url (ParseResult): URL used used for jupyterhub. Contains '/lab/' in its uri
        nb_root (ParseResult): Root path used to search files in. Default is '/home/jovyan/' which works for notebooks hub. Can be set to empty path 
                if absolute paths will be used for images and json files.
        image_location(ParseResult|Purepath): Acquired from urllib.parse.ParseResult or Path, renders url in render.
                            If not specified, renders default render url.
        microjson_overlay_location(ParseResult|Purepath): Acquired from urllib.parse.ParseResult or Path, renders url in render.
                            If not specified, renders default render url
        width (int): width of render to be displayed, default is 960
        height (int): height of render to be displayed, default is 500
    Returns: Render URL
    """
```

# Implementation Details
- Render application is loaded in an IFrame.
- render() builds up URL scheme fragments for render url, image url, and microjson url. It then combines url fragments into a single url which is displayed through an embedded IFrame.
- Static build of Polus Render as well as files to be displayed are served by Jupyter Server extension
- Dragging-and-dropping the dataset does not use a server. It calls an API from the front end (It should the this under the hood https://developer.mozilla.org/en-US/docs/Web/API/File_API).
