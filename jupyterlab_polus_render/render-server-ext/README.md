# Render Server Ext
Jupyter Server Extension serves files and provides a static build of Polus Render.

<img src="images/home.png"/>

# Requirements
- Jupyter Server 2.7.0

# API Endpoints
- `/render/`: Help on usage of extension
- `/static/render/render-ui/index.html`: Serves static build of Polus Render.
- `/render/file/(.+)`: Serves files at a specfied path. Does not serve directories.

# Examples
For the following examples, JupyterLab is ran locally at `https://localhost:8864/lab`


## Render-UI 
URL: `http://localhost:8864/static/serve/render-ui/index.html?imageUrl=https://files.scb-ncats.io/pyramids/segmentations/x00_y01_c1.ome.tif&overlayUrl=https://files.scb-ncats.io/pyramids/segmentations/x00_y01_c1_segmentations.json`

<img src="images/renderui-1.png"/>


URL: `http://localhost:8864/static/serve/render-ui/index.html?imageUrl=http://localhost:8864/serve/file//Users/jeff.chen/Downloads/test_json/x00_y01_p02_c1.ome.tif&overlayUrl=http://localhost:8864/serve/file//Users/jeff.chen/Downloads/test_json/combined.json`

<img src="images/renderui-2.png"/>


## Image
URL: `http://localhost:8864/serve/file//Users/jeff.chen/Downloads/butterfly.jpeg`

<img src="images/image.png"/>

## Markdown
URL: `http://localhost:8864/serve/file//Users/jeff.chen/Downloads/polus-render/Build%20Instructions.md`

<img src="images/markdown.png"/>

