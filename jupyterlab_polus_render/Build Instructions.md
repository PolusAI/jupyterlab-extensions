## Build Instructions
- cd to polus-render root directory.
- 'py -m build'
- 'py -m twine upload  dist/*' or 'py -m twine upload --repository testpypi dist/*'
- Enter '__token__' as user and reference API keys for password

## Adding a local build of Polus Render
- Remove all existing files in '~/polus-render/src/apps/render-ui'. 
- Run 'npx nx build render-ui' in your Polus Render folder
- Tranfer generated files from '/Polus Render/dist/apps/render-ui' into '/polus-render/src/apps/render-ui'. 

## NOTE:
- For each upload, version number must be changed in pyproject.toml
- Add additional files to MANIFEST.in to bundle them with Pypi package

**Git Repository**: https://github.com/jcaxle/polus-render

**Pypi**: https://pypi.org/project/polus-render/

**Test Pypi**: https://test.pypi.org/project/polus-render/
