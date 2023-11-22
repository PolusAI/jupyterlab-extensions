"""Jupyter server example application."""
import os

from jupyter_server.extension.application import ExtensionApp, ExtensionAppJinjaMixin
# Handles incoming requests and adds endpoints
from .handlers import (
    DefaultHandler,
    ErrorHandler,
    AuthFileHandler,
)


DEFAULT_STATIC_FILES_PATH = os.path.join(os.path.dirname(__file__), "static")
DEFAULT_TEMPLATE_FILES_PATH = os.path.join(os.path.dirname(__file__), "templates")


class Application(ExtensionAppJinjaMixin, ExtensionApp):
    """A simple jupyter server application."""
    # The name of the extension.
    name = "serve"

    # The url that your extension will serve its homepage.
    default_url = "/serve/"

    # Should your extension expose other server extensions when launched directly?
    load_other_extensions = True

    # Local path to static files directory.
    static_paths = [DEFAULT_STATIC_FILES_PATH]  # type:ignore[assignment]

    # Local path to templates directory.
    template_paths = [DEFAULT_TEMPLATE_FILES_PATH]  # type:ignore[assignment]

    # Init handlers and link endpoints to them
    def initialize_handlers(self):
        """Initialize handlers."""
        self.handlers.extend(
            [
                (rf"/{self.name}/default/(.+)", DefaultHandler),
                (rf"/{self.name}/file/(.+)", AuthFileHandler, {"path":"/"}),
                (rf"/{self.name}/(.*)", ErrorHandler),
            ]
        )


    def initialize_settings(self):
        """Initialize settings."""
        self.log.info(f"Config {self.config}")

main = launch_new_instance = Application.launch_instance

