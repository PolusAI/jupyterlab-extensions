# jupyterlab_wipp

WIPP integration with JupyterLab


## Requirements

* JupyterLab >= 1.0.0 

## Install

```bash
pip install jupyterlab-wipp
jupyter serverextension enable --py jupyterlab_wipp
jupyter labextension install jupyterlab_wipp
export WIPP_UI_URL=http://wipp-ui.ci.aws.labshare.org/notebooks/
```

## Contributing

### Install

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Move to jupyterlab_wipp directory
# Install serverextension
pip install .
# Register serverextension
jupyter serverextension enable --py jupyterlab_wipp
# Install dependencies
jlpm
# Build Typescript source
jlpm build
# Link your development version of the extension with JupyterLab
jupyter labextension link .
# Rebuild Typescript source after making changes
jlpm build
# Rebuild JupyterLab after making any changes
jupyter lab build
```

You can watch the source directory and run JupyterLab in watch mode to watch for changes in the extension's source and automatically rebuild the extension and application.

```bash
# Watch the source directory in another terminal tab
jlpm watch
# Run jupyterlab in watch mode in one terminal tab
jupyter lab --watch
```

Before starting the JupyterLab, you are required to set the environment variable `WIPP_UI_URL` to point to Notebooks in WIPP, i.e. http://wipp-ui.ci.aws.labshare.org/notebooks/

### Uninstall

```bash
jupyter labextension uninstall jupyterlab_wipp
```

