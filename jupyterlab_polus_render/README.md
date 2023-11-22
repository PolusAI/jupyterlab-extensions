# JupyterLab_Polus_Render

Render application is loaded in an IFrame. The package allows points the IFrame at a production build of render served by `render-server-ext`.

The are three ways to load the data:
1. Specifying a URL to a server serving the data.
2. Specifying a local path from JupyterLab will generate a URL pointing to the path being served from `render-server-ext`. This URL will be passed into the IFrame to be visualized by Render.
3. Dragging-and-dropping the dataset does not use a server, it calls an API from the front end (It should the this under the hood https://developer.mozilla.org/en-US/docs/Web/API/File_API).
</br>

Has the ability to work both local and remote versions of JupyterLab.

Please note that usage differs significantly from https://pypi.org/project/polus-render/0.0.4.0.1.5/

![image](https://github.com/jcaxle/jupyterlab-extensions/assets/145499292/35fb18d8-107a-4dee-9e09-6ff7bf13ac7d)

# Requirements
* Python 3.9+

# Installation
```
pip install "git+https://github.com/jcaxle/jupyterlab-extensions.git@render#egg=jupyterlab_polus_render&subdirectory=jupyterlab_polus_render"
```
You will need to restart Jupyter Server for `render-server-ext` endpoints to take effect.

# Project File Structure
```
jupyterlab_polus_render
| Build Instructions.md           // Instructions on how to update Pypi project
| LICENSE
| requirements.txt
| MANIFEST.in                     // Packaging entries
| pyproject.toml                  // Pypi config 
| README                          
| requirements.txt
└───render-server-ext             // Server extension used by jupyterlab_polus_render
└───polus
    | polus_render.py             // Main file, contains render function used by user
```

# Build Instructions
- Refer to [Build Instructions.md](https://github.com/jcaxle/jupyterlab-extensions/blob/render/jupyterlab_polus_render/Build%20Instructions.md)

# Render: Local build functionality
`jupyterlab_polus_render` is bundled with a build of Polus Render which supporting the following functionality
| Version           | Zarr from URL/Path | TIF from URL/Path   | Micro-JSON Support | Zarr/TIF Drag & Drop | Micro-JSON Drag & Drop | 
|----------------|---------------|---------------|----------------|-----------|-----|
| Local | :heavy_check_mark:  | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark:

# Drag & Drop Demo
![ezgif-4-7162ca42b5](https://github.com/jcaxle/polus-render/assets/145499292/7a59db1e-3128-4ee0-b9cc-ad1be7d3faee)

# Local Jupyter Notebooks Demo
>TODO

# Remote Jupyter Notebooks Demo
>TODO

# Sample usage
``` Python
from polus.polus_render import render

# pathlib and urllib are built-ins
from urllib.parse import urlparse
from pathlib import Path

# Make sure to keep track of your JupyterLab url and file root if your root is not at "/home/joyvan".
JL_URL = urlparse("https://jh.scb-ncats.io/user/jeff.chen@axleinfo.com/user-namespaces/lab?")

# Embeds an IFrame of a local build of Polus Render into Jupyter Lab, this is sufficient if your file root is "/home/joyvan/"
render(nbhub_url=JL_URL)

# Same as above; however, if your file root is "/Users/jeff.chen/", your invocation will require nb_root argument
render(nbhub_url=JL_URL, \
    nb_root=Path("/Users/jeff.chen/"))

# Embeds an IFrame of a local build of Polus Render with an image file hosted at "https://viv-demo.storage.googleapis.com/LuCa-7color_Scan1/"
render(nbhub_url=JL_URL, \
    image_location=urlparse("https://viv-demo.storage.googleapis.com/LuCa-7color_Scan1/"))

# Embeds an IFrame of a local build of Polus Render with an image hosted locally at "/home/joyvan/zarr files/pyramid.zarr"
render(nbhub_url=JL_URL, \
    image_location=Path(r"zarr files/pyramid.zarr"))

# Embeds an IFrame of a local build of Polus Render with an image and overlay file that is hosted locally
render(nbhub_url=JL_URL, \
    image_location=Path("zarr files/pyramid.zarr"), \
    microjson_overlay_location=Path("overlay files/x00_y01_c1_segmentations.json"))

# Embeds an IFrame of a local build of Polus Render with an image and overlay file that is hosted online
render(nbhub_url=JL_URL, \
    image_location=urlparse("https://files.scb-ncats.io/pyramids/segmentations/x00_y01_c1.ome.tif"), \
    microjson_overlay_location=urlparse("https://files.scb-ncats.io/pyramids/segmentations/x00_y03_c1_segmentations.json"))
```

# Functions
``` Python
def render(nbhub_url:ParseResult, nb_root:PurePath = Path("/home/jovyan/"), image_location:Union[ParseResult, PurePath] = "", microjson_overlay_location:Union[ParseResult, PurePath] = "", width:int=960, height:int=500)->str:
    """
    Embeds a local build of render into a JupyterLabs notebook with the help of `render-server-ext`

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
- render() builds up URL scheme fragments for render url, image url, and microjson url.
- If the image url and microjson url are file paths, serve the files through `render-server-ext`.
- At the end, combine render url fragments into a single url, insert it into an IFrame, and display it.
- Complete url string is returned not printed.
- Uses only a local build of Render and does not access the online production build of Render at https://render.ci.ncats.io/.
- No servers are launched. Files are served from endpoints generated from the remote Jupyter Lab's URL. The local build of render is served from the [render-server-ext](https://github.com/jcaxle/render-server-ext) instead of the bundled build files. Essentially, render() runs serverless with the exception of the server that serves Jupyter Lab itself.
