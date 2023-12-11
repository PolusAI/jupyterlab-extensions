from .application import Application


# Sets server activation ID and the app itself, called from jupyter server --ServerApp.jpserver_extensions="{'simple_ext1': True}"
def _jupyter_server_extension_points():
    return [{"module": "serve.application", "app": Application}]
