[![JupyterLab](https://img.shields.io/badge/JupyterLab-4.x-F37626?logo=jupyter&logoColor=white)](https://jupyter.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Pandas](https://img.shields.io/badge/Pandas-2.x-150458?logo=pandas&logoColor=white)](https://pandas.pydata.org/)

<p align="center">
  <img src="./image.png" alt="jupyter-dataset screenshot" width="900" />
</p>

# jupyter-dataset

JupyterLab dataset loading helper with a simple sidebar flow: pick a dataset, choose a notebook, and apply.

Apply appends a code cell to the selected notebook:

```python
from notebooks_data import Dataset

loaded_dataset = Dataset.get("<dataset-name>").read_table(format="pandas")
```

Supported loader formats in the sidebar: `pandas` (default), `numpy`.

## Prerequisites

- Python 3.10+
- JupyterLab 4+
- `pip` and `npm` available on your machine

## Start Up

```bash
./run-jupyterlab-test.sh
```

## Optional Notebook Widget

After JupyterLab starts, run this in a notebook cell:

```python
from ipywidget.example_dataset_explorer import display_dataset_explorer; display_dataset_explorer()
```
