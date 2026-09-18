"""Filesystem and DataFrame helpers for dataset explorer widgets."""

from __future__ import annotations

import importlib
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

try:
    pd = importlib.import_module("pandas")
    EmptyDataError = importlib.import_module("pandas.errors").EmptyDataError
except ModuleNotFoundError:  # pragma: no cover - depends on notebook env
    pd = None
    EmptyDataError = ValueError


SUPPORTED_EXTENSIONS = (".csv", ".tsv", ".parquet", ".json", ".jsonl")


@dataclass
class DatasetInfo:
    """Simple metadata about a dataset directory."""

    name: str
    path: Path


def require_pandas() -> None:
    """Raise with clear guidance if pandas is unavailable."""
    if pd is None:
        raise ModuleNotFoundError(
            "pandas is not installed. Install it with `pip install pandas` "
            "or via your Jupyter environment package manager."
        )


def human_size(size_bytes: int) -> str:
    """Convert byte counts to a readable string."""
    units = ("B", "KB", "MB", "GB", "TB")
    size = float(size_bytes)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.1f} {unit}" if unit != "B" else f"{int(size)} {unit}"
        size /= 1024
    return f"{size_bytes} B"


def list_dataset_dirs(dataset_root: Path) -> list[DatasetInfo]:
    """Return direct child directories from a dataset root."""
    if not dataset_root.exists() or not dataset_root.is_dir():
        return []

    dataset_dirs = []
    for path in sorted(dataset_root.iterdir()):
        if path.is_dir():
            dataset_dirs.append(DatasetInfo(name=path.name, path=path))
    return dataset_dirs


def iter_supported_files(dataset_dir: Path) -> Iterable[Path]:
    """Yield supported tabular files recursively from a dataset directory."""
    for path in sorted(dataset_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield path


def read_dataframe(path: Path, preview_rows: int | None = None):
    """Read a DataFrame using pandas based on file extension."""
    require_pandas()

    suffix = path.suffix.lower()
    if suffix == ".csv":
        return pd.read_csv(path, nrows=preview_rows)
    if suffix == ".tsv":
        return pd.read_csv(path, sep="\t", nrows=preview_rows)
    if suffix == ".parquet":
        frame = pd.read_parquet(path)
        return frame if preview_rows is None else frame.head(preview_rows)
    if suffix == ".json":
        frame = pd.read_json(path)
        return frame if preview_rows is None else frame.head(preview_rows)
    if suffix == ".jsonl":
        frame = pd.read_json(path, lines=True)
        return frame if preview_rows is None else frame.head(preview_rows)
    raise ValueError(f"Unsupported file extension: {suffix}")


def write_dataframe(path: Path, dataframe) -> None:
    """Write a DataFrame back to disk using format based on extension."""
    require_pandas()

    suffix = path.suffix.lower()
    if suffix == ".csv":
        dataframe.to_csv(path, index=False)
        return
    if suffix == ".tsv":
        dataframe.to_csv(path, sep="\t", index=False)
        return
    if suffix == ".parquet":
        dataframe.to_parquet(path, index=False)
        return
    if suffix == ".json":
        dataframe.to_json(path, orient="records")
        return
    if suffix == ".jsonl":
        dataframe.to_json(path, orient="records", lines=True)
        return
    raise ValueError(f"Unsupported file extension: {suffix}")
