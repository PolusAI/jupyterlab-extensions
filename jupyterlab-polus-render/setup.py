# setup.py shim for use with applications that require it.
# __import__("setuptools").setup()


# ---------Below lines copied from render-server-ext--------------

# setup.py shim for use with applications that require it.
from setuptools import setup

setup(
    name="render-server-ext",
    # ...
    entry_points={
        "console_scripts": ["jupyter-serve = serve:launch_instance"]
    },
)