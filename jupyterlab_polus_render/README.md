# Polus Render

Render application is loaded in an iframe. The package allows pointing the iframe at:
* Render deployed to a server
* A Python server running on localhost and serving a production build of render, which has been bundled with this package

The are three ways to load the data:
1. Specifying a URL to a server
2. Specifying a local path will start a Python server on localhost. The URL to the dataset on localhost will be passed to the application in the iframe
3. Dragging-and-dropping the dataset does not use a server, it calls an API from the front end (It should the this under the hood https://developer.mozilla.org/en-US/docs/Web/API/File_API)
</br>

Has the ability to work both local and remote versions of Jupyter Notebook.

![image](https://github.com/jcaxle/polus-render/assets/145499292/2fcd525e-d97a-40fa-87f8-37981bd24be1)

# Requirements
* Python 3.9+
* [polus-server-ext](https://github.com/jcaxle/polus-server-ext) iff running jupyter notebooks remotely.

# Installation
```
pip install polus-render
```

# Dev Installation
```
git clone https://github.com/jcaxle/polus-render.git
cd polus-render
[optional] python -m venv venv
[optional] "venv/Scripts/Activate"
pip install -r requirements.txt
```
Optional steps refer to setting up venv which is recommended.

# Project File Structure
```
polus-render
| Build Instructions.md           // Instructions on how to update Pypi project
| MANIFEST.in                     // Packaging entries
| pyproject.toml                  // Pypi config 
| README                          
| requirements.txt
└───src
    | polus.py                    // Main file, contains render function used by user
    | polus-render-wrapper.py     // Unused file used for a scrapped project. Can be used as a reference for input sanitization
    | zarr_file_server.py         // Contains server only used for serving local build of Polus Render
    ├───apps           
    │   ├───render-ui              // Build files of Polus Render
    │   └───updog-render           // Server used for serving files.
```

# Build Instructions
- Refer to [Build Instructions.md](https://github.com/jcaxle/polus-render/blob/0.0.4/Build%20Instructions.md)

# Submodules
- [Updog-Render](https://github.com/jcaxle/updog-render/tree/71b6b938452f63412eea8edf29b9ff10f4c243dd)

# Render: Local build vs online
polus-render is bundled with a build of Polus Render which supports additional functionality compared to the web version. Table
is accurate as of 10/4/2023.
| Version           | Zarr from URL/Path | TIF from URL/Path   | Micro-JSON Support | Zarr/TIF Drag & Drop | Micro-JSON Drag & Drop | 
|----------------|---------------|---------------|----------------|-----------|-----|
| Local | :heavy_check_mark:  | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark: | :heavy_check_mark:
| Online | :heavy_check_mark:  |  |  |  | 

# Drag & Drop Demo
![ezgif-4-7162ca42b5](https://github.com/jcaxle/polus-render/assets/145499292/7a59db1e-3128-4ee0-b9cc-ad1be7d3faee)

# Local Jupyter Notebooks Demo
>TODO
# Remote Jupyter Notebooks Demo
>TODO
# Sample usage
``` Python
from polus.polus_render import render, nb_render

# pathlib and urllib are built-ins
from urllib.parse import urlparse
from pathlib import Path

# Embeds an IFrame of a local build of Polus Render into Jupyter Notebooks
render()

# Embeds an IFrame of Polus Render into Jupyter Notebooks
render(use_local_render=False)

# Embeds an IFrame of a local build of Polus Render with an image file hosted at "https://viv-demo.storage.googleapis.com/LuCa-7color_Scan1/"
render(image_location=urlparse("https://viv-demo.storage.googleapis.com/LuCa-7color_Scan1/"))

# Embeds an IFrame of a local build of Polus Render with an image hosted locally at "C:\Users\JeffChen\OneDrive - Axle Informatics\Documents\zarr files\pyramid.zarr"
render(image_location=Path(r"C:\Users\JeffChen\OneDrive - Axle Informatics\Documents\zarr files\pyramid.zarr"))

# Embeds an IFrame of a local build of Polus Render with an image and overlay file that is hosted locally
render(image_location=Path(r"C:\Users\JeffChen\OneDrive - Axle Informatics\Documents\zarr files\pyramid.zarr"), \
microjson_overlay_location=Path(r"C:\Users\JeffChen\OneDrive - Axle Informatics\Documents\overlay files\x00_y01_c1_segmentations.json"))

# Embeds an IFrame of a local build of Polus Render with an image and overlay file that is hosted online
render(image_location=urlparse("https://files.scb-ncats.io/pyramids/segmentations/x00_y01_c1.ome.tif"), \
microjson_overlay_location=urlparse("https://files.scb-ncats.io/pyramids/segmentations/x00_y03_c1_segmentations.json"))

# Embeds an IFrame with a height of 1080 of a local build of Polus Render.
render(height=1080)

# Embeds an IFrame into remote jupyter notebooks. Use this function with argument nbhub_url to specify your notebooks url which must have lab in its url
nb_render(nbhub_url=urlparse("https://jh.scb-ncats.io/user/jeff.chen@axleinfo.com/user-namespaces/lab?"), image_location=Path("work/pyramid.zarr"))
```

# Functions
``` Python
def render(image_location:Union[ParseResult, PurePath] = "", microjson_overlay_location:Union[ParseResult, PurePath] = "", width:int=960, height:int=500, image_port:int=0, \
           microjson_overlay_port:int=0, use_local_render:bool=True, render_url:str = "https://render.ci.ncats.io/")->str:
    """
    Displays Polus Render with args to specify display dimensions, port to serve,
    image files to use, and overlay to use.
    
    Param:
        image_location(ParseResult|Purepath): Acquired from urllib.parse.ParseResult or Path, renders url in render.
                            If not specified, renders default render url.
        microjson_overlay_location(ParseResult|Purepath): Acquired from urllib.parse.ParseResult or Path, renders url in render.
                            If not specified, renders default render url
        width (int): width of render to be displayed, default is 960
        height (int): height of render to be displayed, default is 500
        image_port (int): Port to run local zarr server on if used (default is 0 which is the 1st available port).
        microjson_overlay_port (int): Port to run local json server on if used (default is 0 which is the 1st available port).
        use_local_render (bool): True to run local build of render with 1st available port, False to use render_url (default is True)
        render_url (str): URL which refers to Polus Render. Used when run_local_render is False. (default is https://render.ci.ncats.io/)
    Pre: zarr_port and json_port selected (if used) is not in use IF path given is Purepath
    Returns: Render URL
    """

def nb_render(nbhub_url:ParseResult,image_location:Union[ParseResult, PurePath] = "", microjson_overlay_location:Union[ParseResult, PurePath] = "", width:int=960, height:int=500, \
            use_local_render:bool=True, render_url:str = "https://render.ci.ncats.io/")->str:
    """
    Variant of render() used for remote jupyter notebooks. Read render() for usage information

    Param:
        nbhub_url: URL used used for jupyterhub. Contains '/lab/' in its uri
        image_location(ParseResult|Purepath): Acquired from urllib.parse.ParseResult or Path, renders url in render.
                            If not specified, renders default render url.
        microjson_overlay_location(ParseResult|Purepath): Acquired from urllib.parse.ParseResult or Path, renders url in render.
                            If not specified, renders default render url
        width (int): width of render to be displayed, default is 960
        height (int): height of render to be displayed, default is 500
        run_local_render (bool): True to run local build of render with 1st available port, False to use render_url (default is True)
        render_url (str): URL which refers to Polus Render. Used when run_local_render is False. (default is https://render.ci.ncats.io/)
    Returns: Render URL
    """
```

# Implementation Details
- render() receives sanatized input. Check [polus-render-wrapper.py](https://github.com/jcaxle/polus-render/blob/dev-experimental/src/polus-render-wrapper.py) or [sample usage](https://github.com/jcaxle/polus-render/edit/dev-experimental/README.md#sample-usage) for examples on sanitizing input.
- render() builds up URL scheme fragments for render url, image url, and microjson url.
- If the image url and microjson url are file paths, serve the files on file servers pointing to either user specified port or a free port.
- If local render is used, build a server for it as well.
- At the end, combine render url fragments into a single url, insert it into an IFrame, and display it.
- Complete url string is returned not printed.
- For nb_render(), no servers are launched. Files are served from endpoints generated from the remote Jupyter Notebook's URL. The local build of render is served from the [polus-server-ext](https://github.com/jcaxle/polus-server-ext) instead of the bundled build files. Essentially, nb_render() runs serverless with the exception of the server that serves the remote Jupyter Notebooks itself.

# Misc Implementation Details
- Two type of servers are used.
>1. Python HTTPServer with CORS and OPTIONS functionality to serve RenderUI
>2. Modified UpDog Flask server to serve local files to RenderUI

# Acknowledgements
- UpDog: https://github.com/sc0tfree/updog
