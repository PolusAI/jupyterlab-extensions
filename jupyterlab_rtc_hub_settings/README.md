# jupyterlab_rtc_hub_settings

![Github Actions Status](https://github.com/LabShare/jupyterlab-extensions/workflows/Build/badge.svg)

A JupyterLab extension to manage real time collaboration settings on JupyterHub


This extension is composed of a Python package named `jupyterlab_rtc_hub_settings`
for the server extension and a NPM package named `jupyterlab_rtc_hub_settings`
for the frontend extension.

The extension only works with specifically configured JupyterHub (>2.0, requires RBAC). The extension assumes that JupyterHub spawner passed the JupyterHub API key to the environment variable `JUPYTERHUB_API_TOKEN` with a scope `all`, e.g.
```py
{
    'name': 'server',
    'scopes': ['all'],
}
```
Also, the extension assumes that sharing groups and roles have been created for each JupyterHub user with the following names:
- Empty group `server_sharing_{user}`: keeps the list of all users with which I'm sharing my Jupyter server. This is the group that you will see and modify in the extension. Members of the group will have a box checked next to their name
- Group editing role `server_sharing_{user}_group_editing_role`. This roles allows extension to modify the above group on behalf of the user
```
{
    'name': f'server_sharing_{user}_group_editing_role',
    'description': f'Edit server_sharing_{user} group',
    'scopes': [f'groups!group=server_sharing_{user}'],
    'users': [f'{user}']
}
```
- Sharing role `server_sharing_{user}_role`. Strictly speaking is not required for the extension to work, but is enabling the server access for users specified in `server_sharing_{user}`

The example JupyterHub configuration will be provided soon.


## Requirements

* JupyterLab >= 3.0


## Install

To install the extension, execute:

```bash
pip install jupyterlab-rtc-hub-settings
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab-rtc-hub-settings
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
# Change directory to the jupyterlab_rtc_hub_settings directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jupyterlab_rtc_hub_settings
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
jupyter server extension disable jupyterlab_rtc_hub_settings
pip uninstall jupyterlab-rtc-hub-settings
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab_rtc_hub_settings` within that folder.

### Packaging the extension

See [RELEASE](RELEASE.md)
