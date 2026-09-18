import json
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


async def test_list_datasets(jp_fetch, tmp_path, monkeypatch):
    dataset_root = tmp_path / "datasets"
    dataset_dir = dataset_root / "demo"
    dataset_dir.mkdir(parents=True)
    data_file = dataset_dir / "sample.csv"
    data_file.write_text("value,name\n1,a\n2,b\n", encoding="utf-8")
    monkeypatch.setattr(handlers, "DATASET_ROOT", dataset_root)

    datasets_response = await jp_fetch("jupyter-dataset", "datasets")

    assert datasets_response.code == 200

    datasets_payload = json.loads(datasets_response.body)

    assert datasets_payload["dataset_root"] == str(dataset_root)
    assert len(datasets_payload["datasets"]) == 1
    assert datasets_payload["datasets"][0]["name"] == "demo"
    assert datasets_payload["datasets"][0]["files"][0]["path"] == "demo/sample.csv"
