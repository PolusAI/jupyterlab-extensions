# JupyterLab WIPP Plugin Creator extension

<!-- Create wipp plugin by containerizing local code in various languages,  automate the Plugin generation and testing process using both static analysis and templates.  -->
Enter your plugin information, select the code you wish to containerize, create WIPP plugin automatically.

This extension is composed of a Python package named `jupyterlab_wipp_plugin_creator`
for the server extension and a NPM package named `jupyterlab_wipp_plugin_creator`
for the frontend extension.


## Requirements

* JupyterLab >= 3.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_wipp_plugin_creator
export WIPP_API_INTERNAL_URL="enter wipp api url"
export PLUGIN_TEMP_PATH="enter the path to temprorary plugins folder"
```
Note that all paths above should be absolute.

- `WIPP_API_INTERNAL_URL` is the internal URL of WIPP API (usually internal URL on Kubernetes cluster).
- `PLUGIN_TEMP_PATH` is the local path to WIPP's `temp/plugins` folder, where the source, manifest and build dependecies are copied to.

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


## Contributing

### Architecture

Current features:

- Right click on file 'Add to WIPP' to mark code to mark code for containerization.
- On click of 'Create Plugin' button, Post API request containing user input is sent over to the backend.
- Session persistent frontend database to store paths to marked files using IStateDB.
- Create plugin.json, dockerfile, requirements.txt based on inputs.
- Register plugin automatically on WIPP CI https://wipp-ui.ci.aws.labshare.org/plugins.
- Create temp staging folder with random ID and copy selected codes inside.


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

#### Manually fix the bug in @deathbeds/jupyterlab-rjsf to make `formData` work
1. Open `jupyterlab_wipp_plugin_creator/node_modules/@deathbeds/jupyterlab-rjsf/lib/schemaform/model.js`
2. Add to line 13
```js
if (props) {
    this.props = props;
    if (props.formData) {
        this.formData = props.formData;
    }
}
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
