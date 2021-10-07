import json
from pathlib import Path

from ._version import __version__

HERE = Path(__file__).parent.resolve()

with (HERE / "labextension" / "package.json").open() as fid:
    data = json.load(fid)

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": data["name"]
    }]



from .handlers import setup_handlers
from .hub_sharing_settings import HubSharingSettings


def _jupyter_server_extension_points():
    return [{
        "module": "jupyterlab_rtc_hub_settings"
    }]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    server_app.web_app.settings["hub_sharing_settings"] = HubSharingSettings()
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered jupyterlab_rtc_hub_settings extension at URL path /jupyterlab-rtc-hub-settings")

# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension

