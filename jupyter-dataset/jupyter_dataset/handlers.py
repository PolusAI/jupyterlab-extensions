import json
import os
from pathlib import Path
from typing import Any

import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

DATASET_ROOT = Path(os.environ.get("JUPYTER_DATASET_ROOT", "/opt/datasets"))
SUPPORTED_EXTENSIONS = (".csv", ".tsv", ".parquet", ".json", ".jsonl")


def _iter_supported_files(dataset_dir: Path) -> list[Path]:
    return [
        path
        for path in sorted(dataset_dir.rglob("*"))
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    ]


class RouteHandler(APIHandler):
    @tornado.web.authenticated
    def get(self) -> None:
        self.finish(json.dumps({"data": "This is /jupyter-dataset/get-example endpoint!"}))


class DatasetListHandler(APIHandler):
    @tornado.web.authenticated
    def get(self) -> None:
        datasets = []
        if DATASET_ROOT.exists() and DATASET_ROOT.is_dir():
            for dataset_dir in sorted(DATASET_ROOT.iterdir()):
                if not dataset_dir.is_dir():
                    continue
                files = _iter_supported_files(dataset_dir)
                datasets.append(
                    {
                        "name": dataset_dir.name,
                        "path": str(dataset_dir),
                        "files": [
                            {
                                "name": file_path.name,
                                "path": file_path.relative_to(DATASET_ROOT).as_posix(),
                                "size_bytes": file_path.stat().st_size,
                            }
                            for file_path in files
                        ],
                    }
                )

        self.finish(
            json.dumps(
                {
                    "dataset_root": str(DATASET_ROOT),
                    "supported_extensions": list(SUPPORTED_EXTENSIONS),
                    "datasets": datasets,
                }
            )
        )


def setup_handlers(web_app: Any) -> None:
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]
    handlers = [
        (
            url_path_join(base_url, "jupyter-dataset", "get-example"),
            RouteHandler,
        ),
        (
            url_path_join(base_url, "jupyter-dataset", "datasets"),
            DatasetListHandler,
        ),
    ]
    web_app.add_handlers(host_pattern, handlers)
