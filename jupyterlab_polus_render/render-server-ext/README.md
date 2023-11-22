# Render-Server-Ext
Jupyter Server Extension used serve files and provides a local build of Polus Render.

![image](https://github.com/jcaxle/jupyterlab-extensions/assets/145499292/8c883ba2-fd69-4231-859a-d3a25ba2d2f4)

# Requirements
- Jupyter Server 2.7.0 (May work on other versions but tested only on 2.7.0)

# API Endpoints
- `serve/`: Help on usage of extension
- `static/serve/render-ui/index.html`: Serves local version of Polus Render Web Application
- `serve/file/(.+)`: Serves files at a specfied  directory. Does not serve directories.

# Examples
For the following examples, JupyterLab is ran locally at `https://localhost:8864/lab`


## Render-UI 
URL: `http://localhost:8864/static/serve/render-ui/index.html?imageUrl=https://files.scb-ncats.io/pyramids/segmentations/x00_y01_c1.ome.tif&overlayUrl=https://files.scb-ncats.io/pyramids/segmentations/x00_y01_c1_segmentations.json`

![image](https://github.com/jcaxle/jupyterlab-extensions/assets/145499292/450a5821-ef1d-4966-bd4b-4a0d98849a1d)

URL: `http://localhost:8864/static/serve/render-ui/index.html?imageUrl=http://localhost:8864/serve/file//Users/jeff.chen/Downloads/test_json/x00_y01_p02_c1.ome.tif&overlayUrl=http://localhost:8864/serve/file//Users/jeff.chen/Downloads/test_json/combined.json`

<img width="1920" alt="image" src="https://github.com/jcaxle/jupyterlab-extensions/assets/145499292/848b1036-03df-4e0f-985f-79baacbb5adc">


## Image
URL: `http://localhost:8864/serve/file//Users/jeff.chen/Downloads/butterfly.jpeg`

<img width="1920" alt="image" src="https://github.com/jcaxle/jupyterlab-extensions/assets/145499292/7965c4a1-ae18-4a05-a328-ccd064bc0af0">

## Markdown
URL: `http://localhost:8864/serve/file//Users/jeff.chen/Downloads/polus-render/Build%20Instructions.md`

<img width="1920" alt="image" src="https://github.com/jcaxle/jupyterlab-extensions/assets/145499292/c70dfae9-10af-4e47-81be-3c189b1d77b1">

