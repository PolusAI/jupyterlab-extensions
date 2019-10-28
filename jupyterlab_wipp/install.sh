pip install .
jupyter serverextension enable --py jupyterlab_wipp
jlpm
jlpm build
jupyter labextension link .
jlpm build
jupyter lab build