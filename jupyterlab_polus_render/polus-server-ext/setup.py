# setup.py shim for use with applications that require it.
from setuptools import setup

setup(
    name="myfrontend",
    # ...
    entry_points={
        "console_scripts": ["jupyter-serve = serve:launch_instance"]
    },
)