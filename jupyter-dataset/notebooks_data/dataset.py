import os
from dataclasses import dataclass
from pathlib import Path
from typing import Union

import numpy as np
import pandas as pd

DATASET_ROOT = Path(os.environ.get("JUPYTER_DATASET_ROOT", "/opt/datasets"))
SUPPORTED_EXTENSIONS = (".parquet", ".csv", ".tsv", ".json", ".jsonl")


@dataclass(frozen=True)
class Dataset:
    name: str

    @classmethod
    def get(cls, name: str) -> "Dataset":
        clean_name = name.strip()
        if not clean_name:
            raise ValueError("Dataset name cannot be empty.")
        return cls(name=clean_name)

    def read_table(self, format: str = "pandas") -> Union[pd.DataFrame, np.ndarray]:
        if format not in {"pandas", "numpy"}:
            raise ValueError("format must be one of: numpy, pandas")
        dataset_file = self._resolve_dataset_file()
        dataframe = self._read_dataframe(dataset_file)
        if format == "numpy":
            return dataframe.to_numpy()
        return dataframe

    def _read_dataframe(self, dataset_file: Path) -> pd.DataFrame:
        suffix = dataset_file.suffix.lower()
        if suffix == ".csv":
            return pd.read_csv(dataset_file)
        if suffix == ".tsv":
            return pd.read_csv(dataset_file, sep="\t")
        if suffix == ".parquet":
            return pd.read_parquet(dataset_file)
        if suffix == ".json":
            return pd.read_json(dataset_file)
        if suffix == ".jsonl":
            return pd.read_json(dataset_file, lines=True)
        raise ValueError(f"Unsupported dataset file extension: {suffix}")

    def _resolve_dataset_file(self) -> Path:
        dataset_dir = (DATASET_ROOT / self.name).resolve()
        if not dataset_dir.exists() or not dataset_dir.is_dir():
            raise FileNotFoundError(
                f"Dataset '{self.name}' not found under {DATASET_ROOT}."
            )

        for extension in SUPPORTED_EXTENSIONS:
            matches = sorted(dataset_dir.rglob(f"*{extension}"))
            if matches:
                return matches[0]

        raise FileNotFoundError(
            f"No supported dataset files found for '{self.name}' under {dataset_dir}."
        )
