import os
from IPython.display import display, IFrame
from urllib.parse import ParseResult
from pathlib import PurePath, Path
from typing import Union


class MissingEnvironmentVariable(Exception):
    def __init__(self, message):
        self.message = message
    def __str__(self):
        return self.message


def render(nbhub_url:ParseResult, nb_root:PurePath = Path(os.getenv('HOME')) if "HOME" in os.environ else Path("/home/jovyan/"), image_location:Union[ParseResult, PurePath] = "", 
           microjson_overlay_location:Union[ParseResult, PurePath] = "", width:int=960, height:int=500, use_static:bool = True)->str:
    """
    Embeds Polus Render into a JupyterLabs notebook with the help of `render-server-ext`

    Param:
        nbhub_url (ParseResult): URL used used for jupyterhub. Contains '/lab/' in its uri
        nb_root (PurePath): Root path used to search files in. Default is os.getenv('HOME') else \"/home/joyvan/\""
                            if HOME does not exist.
                if absolute paths will be used for images and json files.
        image_location(ParseResult|Purepath): Acquired from urllib.parse.ParseResult or Path, renders url in render.
                            If not specified, renders default render url.
        microjson_overlay_location(ParseResult|Purepath): Acquired from urllib.parse.ParseResult or Path, renders url in render.
                            If not specified, renders default render url
        width (int): width of render to be displayed, default is 960
        height (int): height of render to be displayed, default is 500
        use_static (bool): Use static build of render, default is True
    Returns: Render URL
    """
    assert(nbhub_url)
    base_nbhub = nbhub_url.geturl().rpartition("lab")[0]
    # Extract url from file path if provided. ?imageUrl is required scheme for render
    if isinstance(image_location, PurePath):
        assert(os.path.exists(os.path.join(str(nb_root), str(image_location))))
        image_location = "?imageUrl=" + base_nbhub + "render/file/" + os.path.join(str(nb_root), str(image_location))

    # Otherwise, extract url from user provided url if provided
    elif isinstance(image_location, ParseResult):
        image_location = "?imageUrl=" + image_location.geturl() # Can be manually rebuilt to check if a valid format url is sent

    # Do the same but for JSON
    if isinstance(microjson_overlay_location, PurePath):
        assert(os.path.exists(os.path.join(str(nb_root), str(microjson_overlay_location))))
        microjson_overlay_location = "&overlayUrl=" + base_nbhub + "render/file/" + os.path.join(str(nb_root), str(microjson_overlay_location))

    elif isinstance(microjson_overlay_location, ParseResult):
        microjson_overlay_location = "&overlayUrl=" + microjson_overlay_location.geturl()    

    # static render
    if use_static:
        render_url = f"{base_nbhub}static/render/render-ui/index.html"
    elif("RENDER_URL" in os.environ):
        render_url = os.getenv('RENDER_URL')
    else:
        raise MissingEnvironmentVariable("RENDER_URL enviromental variable does not exist!")        
    
    # Display render
    display(IFrame(src=(f"{render_url}{image_location}{microjson_overlay_location}")
                                                        ,width=width, height=height))
    
    return f"{render_url}{image_location}{microjson_overlay_location}"

