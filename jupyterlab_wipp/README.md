# Jupyterlab WIPP extension

![Github Actions Status](https://github.com/labshare/jupyterlab-extensions.git/workflows/Build/badge.svg)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/labshare/jupyterlab-extensions.git/main?urlpath=lab)

[WIPP](https://github.com/usnistgov/wipp) integration with JupyterLab

This extension is composed of a Python package named `jupyterlab_wipp`
for the server extension and a NPM package named `jupyterlab_wipp`
for the frontend extension.


## Requirements

* JupyterLab >= 3.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_wipp
export WIPP_UI_URL=""
export WIPP_API_INTERNAL_URL=""
export WIPP_NOTEBOOKS_PATH=""
```

The last three steps are required environment variables. 

- `WIPP_UI_URL` is the WIPP frontend base URL which will be used to open collection pages.
- `WIPP_API_INTERNAL_URL` is the internal URL of WIPP API (usually internal URL on Kubernetes cluster)
- `WIPP_NOTEBOOKS_PATH` is the local path to WIPP's `temp/notebooks` folder

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_wipp
```


## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```


## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_wipp directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jupyterlab_wipp
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Manually build and upload release

To manually build and publish prebuilt extension bundle, run the following commands (`jupyter_packaging` and `twine` are required)

```bash
pip install -e .
python setup.py sdist bdist_wheel
twine check dist/*
twine upload dist/*
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyterlab_wipp
pip uninstall jupyterlab_wipp
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab_wipp` within that folder.
