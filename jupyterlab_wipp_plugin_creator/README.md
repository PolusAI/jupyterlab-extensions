# JupyterLab WIPP Plugin Creator extension

Enter your plugin information. Select the code you wish to containerize. Create WIPP plugin automatically.

This extension is composed of a Python package named `jupyterlab_wipp_plugin_creator`
for the server extension and a NPM package named `jupyterlab_wipp_plugin_creator`
for the frontend extension.


## Requirements

* JupyterLab >= 3.0
* wipp-client
* kubernetes

## Install

To install the extension, execute:

```bash
pip install jupyterlab_wipp_plugin_creator
export WIPP_API_INTERNAL_URL="enter wipp api url"
export PLUGIN_TEMP_PATH="enter the path to temprorary plugins folder"
```
Note that all paths above should be absolute. Environment variables set using export commands will be lost if bash session is restarted, hence needed to be created by running the export commands again.

- `WIPP_API_INTERNAL_URL` is the internal URL of WIPP API (usually internal URL on Kubernetes cluster).
- `PLUGIN_TEMP_PATH` is the local path to WIPP's `temp/plugins` folder, where the source code is copied and plugin manifest and build dependecies are generated.

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_wipp_plugin_creator
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

If Jupyter Lab is not hosted on a Kubernetes environement, or local testing is desired, use this command to disable the Kubernetes Client to avoid error. Note: no image will be built or published but plugin.json, requirements.txt and Dockerfile will be generated in the folder set by environment variable PLUGIN_TEMP_PATH:

```bash
export WIPP_PLUGIN_CREATOR_DISABLE_BUILD=1
```

If the access to a running instance of WIPP is not possible, or local testing is desired, use this command to disable plugin registration in WIPP:

```bash
export WIPP_PLUGIN_CREATOR_DISABLE_REGISTER=1
```

To renable image build and plugin registration, you can set the variables to zero:

```bash
export WIPP_PLUGIN_CREATOR_DISABLE_BUILD=0
export WIPP_PLUGIN_CREATOR_DISABLE_REGISTER=0
```

Wh


## Contributing

### Architecture

#### Current features:

- Right click on file 'Add to WIPP' to select code for containerization.
- Filemanager to select multiple codes for containerization via Ctrl + Left Click.
- Session persistent frontend database to store paths to marked files using IStateDB.
- Live Validation of user inputs.
- On click of 'Create Plugin' button:
    - Send post API request containing user input to the backend.
    - Create plugin.json, dockerfile, requirements.txt based on inputs.
    - Generate 'ui' keys for plugin.json based on 'input' keys.
    - Register plugin on WIPP CI https://wipp-ui.ci.aws.labshare.org/plugins.
    - Create temp staging folder with random ID and copy selected codes inside.
    - Use Jinga2 template to generate Dockerfile, including pip install of requirements.txt.
    - Submit Argo job via Kubernetes Client to build the image via a Kaniko container.
    - Publish the image on PolusAI Dockerhub.

#### Known issues:

 - As of 0.2.4, after selecting file to add to wipp plugin either through right click menu or file manager, user need to manually hit button "Update list of files" at the top in order for database to update. 
 - As of 0.2.4, UI key is automatically generated and will only contain "key" (name), "title", and "description". Hard-coding and more complex 'ui' keys with more fields such as "default" and "condition" are not supported. 

#### Planned improvements:

- Support of Jupyter notebooks as a file source
- Support of multiple languages
- Static analysis of dependencies

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_wipp_plugin_creator directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jupyterlab_wipp_plugin_creator
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

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyterlab_wipp_plugin_creator
pip uninstall jupyterlab_wipp_plugin_creator
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab_wipp_plugin_creator` within that folder.

### Packaging the extension

See [RELEASE](RELEASE.md)
