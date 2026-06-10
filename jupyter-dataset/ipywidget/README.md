# Ipywidget Dataset Explorer

This folder contains a notebook-native dataset explorer widget that runs fully in Python.

## Why this approach

This is a practical alternative to building a full custom JupyterLab frontend extension when your goal is:
- browse mounted dataset files inside notebooks
- preview tabular data quickly
- apply lightweight DataFrame transforms and write results back

Because this widget is Python-based (`ipywidgets` + `pandas`), you can distribute it as a normal Python package and avoid shipping/maintaining a separate TypeScript labextension for this workflow.

## Can this be public on PyPI and preinstalled?

Yes. You can publish this package to PyPI, then install it in your notebook container image by default.

Typical flow:
1. Publish your package to PyPI.
2. Add it to the container build (for example `pip install your-package-name`).
3. Ensure runtime dependencies are present (`ipywidgets`, `pandas`).
4. Import and launch it from notebook cells.

In most modern JupyterLab setups (Lab 3/4), `ipywidgets` works without manual labextension build steps.

## What this does not replace

This does not replace server-side extension capabilities when you need:
- custom Jupyter REST APIs or server handlers
- deep JupyterLab shell integrations (menus, commands, launcher items, custom front-end panels)
- organization-wide policy/control features at the platform layer

For notebook-centric data exploration and transformation, this widget-first model is often faster to build and easier to maintain.

## Quick notebook usage

If this directory is available in the notebook environment:

```python
from pathlib import Path
import sys

sys.path.insert(0, str(Path.home() / "ipywidget"))

from example_dataset_explorer import display_dataset_explorer

explorer = display_dataset_explorer(dataset_root="/opt/datasets", preview_rows=20)
```
