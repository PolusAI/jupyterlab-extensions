import os
from IPython.display import display, IFrame
from urllib.parse import ParseResult
from pathlib import PurePath, Path
from typing import Union



def render(nbhub_url:ParseResult, nb_root:PurePath = Path("/home/jovyan/"), image_location:Union[ParseResult, PurePath] = "", microjson_overlay_location:Union[ParseResult, PurePath] = "", width:int=960, height:int=500)->str:
    """
    Embeds a local build of render into a JupyterLabs notebook with the help of `polus-server-ext`

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
    assert(nbhub_url)
    base_nbhub = nbhub_url.geturl().rpartition("lab")[0]
    # Extract url from local file path if provided. ?imageUrl is required scheme for render
    if isinstance(image_location, PurePath):
        image_location = "?imageUrl=" + base_nbhub + "serve/file/" + os.path.join(str(nb_root), str(image_location))

    # Otherwise, extract url from user provided url if provided
    elif isinstance(image_location, ParseResult):
        image_location = "?imageUrl=" + image_location.geturl() # Can be manually rebuilt to check if a valid format url is sent
    
    # Do the same but for JSON
    if isinstance(microjson_overlay_location, PurePath):
        microjson_overlay_location = "&overlayUrl=" + base_nbhub + "serve/file/" + os.path.join(str(nb_root), str(microjson_overlay_location))

    elif isinstance(microjson_overlay_location, ParseResult):
        microjson_overlay_location = "&overlayUrl=" + microjson_overlay_location.geturl()    

    # Local render
    render_url = f"{base_nbhub}static/serve/render-ui/index.html"
    
    # Display render
    display(IFrame(src=(f"{render_url}{image_location}{microjson_overlay_location}")
                                                        , width=width, height=height))
    
    return f"{render_url}{image_location}{microjson_overlay_location}"

