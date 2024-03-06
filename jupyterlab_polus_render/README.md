# Jupyterlab Polus Render

JupyterLab Polus Render makes Polus Render available as a JupyterLab extension. 

Polus Render allows visualizing tiled raster datasets in Zarr and TIFF formats, as well as vector overlays in MicroJSON format. It uses lookup tables to map intensity values in these datasets to colors.

The are three ways to load the data:
1. Specifying a URL to the server serving the data.
2. Specifying a local path to a file from JupyterLab.
3. Dragging-and-dropping the dataset.
</br>

<img src="images/image.png"/>

## Requirements

* JupyterLab >= 4.0

## Install

You can install using `pip`:

```bash
pip install jupyterlab_polus_render
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_polus_render
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

## Sample usage
```Python
from jupyterlab_polus_render import Render

# Initiates Polus Render.
Render()

# Shows a tiff image by providing the local path. 
Render(imagePath = 'images/LuCa-7color_3x3component_data.ome.tif')

# Shows a tiff image by providing the local path along with an overlay used for the image. 
Render(imagePath = 'images/LuCa-7color_3x3component_data.ome.tif', overlayPath = 'images/overlay_render2.json')

# Shows a tiff image by providing a remote url. 
Render(imagePath = 'https://viv-demo.storage.googleapis.com/LuCa-7color_3x3component_data.ome.tif')

# Shows a zarr dataset by providing the local path along with an overlay used for the dataset. 
Render(imagePath = 'images/pyramid.zarr', overlayPath = 'images/overlay_render2.json')
```

# Implementation Details

### Frontend
- The frontend part of the extension effectively utilizes the @labshare/polus-render npm package which is used to visualize tiled TIFF images and overlays given the URL of the image/overlay. 

### Backend 
- The backend functionality, including serving images is handled by the server extension. This extension is integrated with the Jupyterlab server environment and allows custom functionality based on the application's needs.  

###
- In summary, the Jupyterlab Polus Render extension combines the frontend and the backend components into a single extension.


# API Endpoints

- `/jupyterlab-polus-render/image/(.+)`: Shows tiff images and zarr datasets at a specfied path.


## Contributing
### Development Install

Create a dev environment:
```bash
conda create -n jupyterlab_polus_render-dev -c conda-forge nodejs python jupyterlab=4.0.11 ipywidgets
conda activate jupyterlab_polus_render-dev
```

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_polus_render directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jupyterlab_polus_render
# Rebuild extension Typescript source after making changes
jlpm run build
```

### How to see your changes
#### Typescript:
If you use JupyterLab to develop then you can watch the source directory and run JupyterLab at the same time in different
terminals to watch for changes in the extension's source and automatically rebuild the widget.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

After a change wait for the build to finish and then refresh your browser and the changes should take effect.

#### Python:
If you make a change to the python code then you will need to restart the notebook kernel to have it take effect.


### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyterlab_polus_render
pip uninstall jupyterlab_polus_render
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab_polus_render` within that folder.
