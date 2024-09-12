import json
import os
from pathlib import Path

from ._version import __version__

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": data["name"]}]


from .handlers import setup_handlers
from wipp_client import Wipp


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_wipp"}]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    wipp_ui_url = os.getenv("WIPP_UI_URL") if "WIPP_UI_URL" in os.environ else ""

    server_app.web_app.settings["wipp_urls"] = {
        "notebooks_ui_url": os.path.join(wipp_ui_url, "notebooks/"),
        "imagescollections_ui_url": os.path.join(wipp_ui_url, "images-collections/"),
        "imagescollection_ui_url": os.path.join(wipp_ui_url, "images-collection/"),
        "csvcollections_ui_url": os.path.join(wipp_ui_url, "csv-collections/"),
    }

    server_app.web_app.settings["wipp"] = Wipp()
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered jupyterlab_wipp extension at URL path /wipp")


# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension
