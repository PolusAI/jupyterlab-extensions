from pathlib import Path

from notebooks_data import dataset as dataset_module


def test_dataset_get_rejects_empty_name():
    try:
        dataset_module.Dataset.get("   ")
        assert False, "Expected ValueError"
    except ValueError:
        pass


def test_dataset_read_table_pandas(tmp_path, monkeypatch):
    dataset_root = tmp_path / "datasets"
    source_dir = dataset_root / "demo"
    source_dir.mkdir(parents=True)
    (source_dir / "table.csv").write_text("value\n1\n2\n", encoding="utf-8")
    monkeypatch.setattr(dataset_module, "DATASET_ROOT", Path(dataset_root))

    loaded = dataset_module.Dataset.get("demo").read_table(format="pandas")

    assert loaded["value"].tolist() == [1, 2]


def test_dataset_read_table_numpy(tmp_path, monkeypatch):
    dataset_root = tmp_path / "datasets"
    source_dir = dataset_root / "demo"
    source_dir.mkdir(parents=True)
    (source_dir / "table.csv").write_text("value\n1\n2\n", encoding="utf-8")
    monkeypatch.setattr(dataset_module, "DATASET_ROOT", Path(dataset_root))

    loaded = dataset_module.Dataset.get("demo").read_table(format="numpy")

    assert loaded.shape == (2, 1)
    assert loaded.tolist() == [[1], [2]]
