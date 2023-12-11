# setup.py shim for use with applications that require it.
from setuptools import setup

setup(
    name="render-server-ext",
    # ...
    entry_points={
        "console_scripts": ["jupyter-serve = serve:launch_instance"]
    },
)