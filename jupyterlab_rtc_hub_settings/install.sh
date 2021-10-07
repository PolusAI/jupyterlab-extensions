pip install jupyter-packaging
pip install -e /extension
jupyter labextension develop /extension --overwrite
jupyter server extension enable jupyterlab_rtc_hub_settings
jlpm run build