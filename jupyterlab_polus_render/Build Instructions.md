## Build Instructions
- cd to `jupyterlab_polus_render` root directory.
- `py -m build`
- `py -m twine upload  dist/*` or `py -m twine upload --repository testpypi dist/*`
- Enter `__token__` as user and reference API keys for password

## Adding a local build of Polus Render
- Remove all existing files in `~/jupyterlab_polus_render/polus-server-ext/serve/static/render-ui/`. 
- Run `npx nx build render-ui` in the root of your Polus Render folder
- Tranfer generated files from `/Polus Render/dist/apps/render-ui/` into `~/jupyterlab_polus_render/polus-server-ext/serve/static/render-ui/`. 

## NOTE:
- For each upload, version number must be changed in `pyproject.toml`
- Add additional files to `MANIFEST.in` to bundle them with Pypi package

**Git Repository**: [https://github.com/jcaxle/polus-render](https://github.com/jcaxle/jupyterlab-extensions/tree/render_revisions/jupyterlab_polus_render)

**Pypi**: TODO

**Test Pypi**: TODO
