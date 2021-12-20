import json
from pathlib import Path

from ._version import __version__
from wipp_client import Wipp

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]



from .handlers import setup_handlers


def _jupyter_server_extension_points():
    return [{
        "module": "jupyterlab_wipp_plugin_creator"
    }]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    # Initialize and save Wipp object to key
    server_app.web_app.settings["wipp-plugin-creator"] = Wipp()
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered the extension at URL path /jupyterlab_wipp_plugin_creator")
    

# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension

