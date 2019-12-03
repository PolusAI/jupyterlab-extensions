from jupyterlab_wipp.handlers import setup_handlers
from jupyterlab_wipp.wipp import Wipp


def _jupyter_server_extension_paths():
    return [{
        'module': 'jupyterlab_wipp'
    }]


def load_jupyter_server_extension(nb_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.
    Parameters
    ----------
    nb_app: notebook.notebookapp.NotebookApp
        Notebook application instance
    """

    w = Wipp()
    nb_app.web_app.settings["wipp"] = w
    setup_handlers(nb_app.web_app)
    nb_app.log.info(f'Registered jupyterlab_wipp extension at URL path /wipp')