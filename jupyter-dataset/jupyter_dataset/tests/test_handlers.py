import json
from pathlib import Path

import nbformat
from jupyter_dataset import handlers


async def test_get_example(jp_fetch):
    # When
    response = await jp_fetch("jupyter-dataset", "get-example")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "data": "This is /jupyter-dataset/get-example endpoint!"
    }


async def test_list_datasets_and_notebooks(jp_fetch, jp_serverapp, tmp_path, monkeypatch):
    dataset_root = tmp_path / "datasets"
    dataset_dir = dataset_root / "demo"
    dataset_dir.mkdir(parents=True)
    data_file = dataset_dir / "sample.csv"
    data_file.write_text("value,name\n1,a\n2,b\n", encoding="utf-8")
    monkeypatch.setattr(handlers, "DATASET_ROOT", dataset_root)

    notebook_path = Path(jp_serverapp.root_dir) / "transform.ipynb"
    notebook = nbformat.v4.new_notebook(
        cells=[nbformat.v4.new_code_cell("result = df", metadata={"tags": ["dataset-transform"]})]
    )
    nbformat.write(notebook, notebook_path)

    datasets_response = await jp_fetch("jupyter-dataset", "datasets")
    notebooks_response = await jp_fetch("jupyter-dataset", "notebooks")

    assert datasets_response.code == 200
    assert notebooks_response.code == 200

    datasets_payload = json.loads(datasets_response.body)
    notebooks_payload = json.loads(notebooks_response.body)

    assert datasets_payload["dataset_root"] == str(dataset_root)
    assert len(datasets_payload["datasets"]) == 1
    assert datasets_payload["datasets"][0]["name"] == "demo"
    assert datasets_payload["datasets"][0]["files"][0]["path"] == "demo/sample.csv"

    assert "transform.ipynb" in notebooks_payload["notebooks"]
    assert "notebook_entries" not in notebooks_payload


async def test_apply_appends_loader_cell(jp_fetch, jp_serverapp, tmp_path, monkeypatch):
    dataset_root = tmp_path / "datasets"
    dataset_dir = dataset_root / "demo"
    dataset_dir.mkdir(parents=True)
    data_file = dataset_dir / "sample.csv"
    data_file.write_text("value,name\n1,a\n2,b\n", encoding="utf-8")
    monkeypatch.setattr(handlers, "DATASET_ROOT", dataset_root)

    notebook_path = Path(jp_serverapp.root_dir) / "transform.ipynb"
    notebook = nbformat.v4.new_notebook(cells=[nbformat.v4.new_markdown_cell("start")])
    nbformat.write(notebook, notebook_path)

    response = await jp_fetch(
        "jupyter-dataset",
        "apply",
        method="POST",
        body=json.dumps(
            {
                "dataset_file": "demo/sample.csv",
                "notebook_path": "transform.ipynb",
                "dataset_name": "demo",
                "format": "pandas",
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["status"] == "ok"
    assert payload["dataset_file"] == "demo/sample.csv"
    assert payload["dataset_name"] == "demo"
    assert payload["format"] == "pandas"
    assert payload["notebook_path"] == "transform.ipynb"
    assert payload["cell_index"] == 1

    updated_notebook = nbformat.read(notebook_path, as_version=4)
    inserted_cell = updated_notebook["cells"][1]
    assert inserted_cell["cell_type"] == "code"
    assert "from notebooks_data import Dataset" in inserted_cell["source"]
    assert 'loaded_dataset = Dataset.get("demo").read_table(format="pandas")' in inserted_cell["source"]
    assert "dataset-loader" in inserted_cell.get("metadata", {}).get("tags", [])


async def test_apply_infers_dataset_name_from_dataset_file(
    jp_fetch, jp_serverapp, tmp_path, monkeypatch
):
    dataset_root = tmp_path / "datasets"
    dataset_dir = dataset_root / "demo"
    dataset_dir.mkdir(parents=True)
    data_file = dataset_dir / "sample.csv"
    data_file.write_text("value\n1\n2\n", encoding="utf-8")
    monkeypatch.setattr(handlers, "DATASET_ROOT", dataset_root)

    notebook_path = Path(jp_serverapp.root_dir) / "transform.ipynb"
    notebook = nbformat.v4.new_notebook(cells=[])
    nbformat.write(notebook, notebook_path)

    response = await jp_fetch(
        "jupyter-dataset",
        "apply",
        method="POST",
        body=json.dumps(
            {
                "dataset_file": "demo/sample.csv",
                "notebook_path": "transform.ipynb",
                "format": "pandas",
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["dataset_name"] == "demo"


async def test_apply_supports_numpy_format(jp_fetch, jp_serverapp, tmp_path, monkeypatch):
    dataset_root = tmp_path / "datasets"
    dataset_dir = dataset_root / "demo"
    dataset_dir.mkdir(parents=True)
    data_file = dataset_dir / "sample.csv"
    data_file.write_text("value\n1\n2\n", encoding="utf-8")
    monkeypatch.setattr(handlers, "DATASET_ROOT", dataset_root)

    notebook_path = Path(jp_serverapp.root_dir) / "transform.ipynb"
    notebook = nbformat.v4.new_notebook(cells=[])
    nbformat.write(notebook, notebook_path)

    response = await jp_fetch(
        "jupyter-dataset",
        "apply",
        method="POST",
        body=json.dumps(
            {
                "dataset_file": "demo/sample.csv",
                "notebook_path": "transform.ipynb",
                "dataset_name": "demo",
                "format": "numpy",
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload["format"] == "numpy"

    updated_notebook = nbformat.read(notebook_path, as_version=4)
    inserted_cell = updated_notebook["cells"][0]
    assert (
        'loaded_dataset = Dataset.get("demo").read_table(format="numpy")'
        in inserted_cell["source"]
    )


async def test_apply_rejects_unsupported_format(
    jp_fetch, jp_serverapp, tmp_path, monkeypatch
):
    dataset_root = tmp_path / "datasets"
    dataset_dir = dataset_root / "demo"
    dataset_dir.mkdir(parents=True)
    data_file = dataset_dir / "sample.csv"
    data_file.write_text("value\n1\n2\n", encoding="utf-8")
    monkeypatch.setattr(handlers, "DATASET_ROOT", dataset_root)

    notebook_path = Path(jp_serverapp.root_dir) / "transform.ipynb"
    notebook = nbformat.v4.new_notebook(cells=[])
    nbformat.write(notebook, notebook_path)

    response = await jp_fetch(
        "jupyter-dataset",
        "apply",
        method="POST",
        body=json.dumps(
            {
                "dataset_file": "demo/sample.csv",
                "notebook_path": "transform.ipynb",
                "dataset_name": "demo",
                "format": "polars",
            }
        ),
        headers={"Content-Type": "application/json"},
    )
    assert response.code == 400
    payload = json.loads(response.body)
    assert "format must be one of:" in payload["reason"]