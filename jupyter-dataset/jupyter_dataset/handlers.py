import json
import os
from pathlib import Path
from typing import Any

import nbformat
import tornado
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join

DATASET_ROOT = Path(os.environ.get("JUPYTER_DATASET_ROOT", "/opt/datasets"))
SUPPORTED_EXTENSIONS = (".csv", ".tsv", ".parquet", ".json", ".jsonl")
DEFAULT_TABLE_FORMAT = "pandas"
SUPPORTED_TABLE_FORMATS = {"pandas", "numpy"}


def _resolve_path(raw_path: str, root_dir: Path) -> Path:
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = root_dir / candidate
    return candidate.resolve()


def _require_within_root(path: Path, root_dir: Path, label: str) -> None:
    try:
        path.relative_to(root_dir)
    except ValueError as exc:
        raise tornado.web.HTTPError(
            400, reason=f"{label} must live under {root_dir}"
        ) from exc


def _is_supported_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS


def _iter_supported_files(dataset_dir: Path) -> list[Path]:
    return [
        path
        for path in sorted(dataset_dir.rglob("*"))
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    ]


def _read_notebook(notebook_path: Path) -> dict[str, Any]:
    try:
        return nbformat.read(notebook_path, as_version=4)
    except Exception as exc:
        raise tornado.web.HTTPError(
            400, reason=f"Failed to read notebook {notebook_path}: {exc}"
        ) from exc


def _build_loader_cell_source(dataset_name: str, table_format: str) -> str:
    return "\n".join(
        [
            "from notebooks_data import Dataset",
            "",
            (
                f"loaded_dataset = Dataset.get({json.dumps(dataset_name)})."
                f"read_table(format={json.dumps(table_format)})"
            ),
        ]
    )


def _append_loader_cell(
    notebook_path: Path, dataset_name: str, table_format: str
) -> tuple[int, str]:
    notebook = _read_notebook(notebook_path)
    loader_source = _build_loader_cell_source(dataset_name, table_format)
    notebook.setdefault("cells", [])
    notebook["cells"].append(
        nbformat.v4.new_code_cell(
            loader_source,
            metadata={"tags": ["dataset-loader", f"dataset:{dataset_name}"]},
        )
    )
    nbformat.write(notebook, notebook_path)
    return len(notebook["cells"]) - 1, loader_source


def _notebook_root(handler: APIHandler) -> Path:
    contents_manager = handler.settings.get("contents_manager")
    if contents_manager is None:
        raise tornado.web.HTTPError(500, reason="Contents manager unavailable.")
    return Path(contents_manager.root_dir).resolve()


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


class NotebookListHandler(APIHandler):
    @tornado.web.authenticated
    def get(self) -> None:
        notebook_root = _notebook_root(self)
        notebooks: list[str] = []
        for path in sorted(notebook_root.rglob("*.ipynb")):
            if ".ipynb_checkpoints" in path.parts:
                continue
            rel_path = path.relative_to(notebook_root).as_posix()
            notebooks.append(rel_path)

        self.finish(
            json.dumps(
                {
                    "notebook_root": str(notebook_root),
                    "notebooks": notebooks,
                }
            )
        )


class ApplyDatasetHandler(APIHandler):
    @tornado.web.authenticated
    def post(self) -> None:
        body = self.get_json_body() or {}
        dataset_file = (body.get("dataset_file") or "").strip()
        notebook_path_value = (body.get("notebook_path") or "").strip()
        dataset_name = (body.get("dataset_name") or "").strip()
        table_format = (
            (body.get("format") or DEFAULT_TABLE_FORMAT).strip()
            or DEFAULT_TABLE_FORMAT
        )

        if not dataset_file:
            raise tornado.web.HTTPError(400, reason="dataset_file is required.")
        if not notebook_path_value:
            raise tornado.web.HTTPError(400, reason="notebook_path is required.")
        if table_format not in SUPPORTED_TABLE_FORMATS:
            raise tornado.web.HTTPError(
                400,
                reason=(
                    "format must be one of: "
                    f"{', '.join(sorted(SUPPORTED_TABLE_FORMATS))}"
                ),
            )

        resolved_dataset_path = _resolve_path(dataset_file, DATASET_ROOT)
        _require_within_root(resolved_dataset_path, DATASET_ROOT.resolve(), "dataset_file")
        if not _is_supported_file(resolved_dataset_path):
            raise tornado.web.HTTPError(
                400,
                reason=(
                    "dataset_file must reference an existing supported file under "
                    f"{DATASET_ROOT}"
                ),
            )

        notebook_root = _notebook_root(self)
        resolved_notebook_path = _resolve_path(notebook_path_value, notebook_root)
        _require_within_root(resolved_notebook_path, notebook_root, "notebook_path")
        if (
            not resolved_notebook_path.exists()
            or resolved_notebook_path.suffix.lower() != ".ipynb"
        ):
            raise tornado.web.HTTPError(
                400,
                reason="notebook_path must reference an existing .ipynb file.",
            )

        if not dataset_name:
            dataset_name = resolved_dataset_path.parts[-2]

        cell_index, cell_source = _append_loader_cell(
            resolved_notebook_path,
            dataset_name=dataset_name,
            table_format=table_format,
        )
        self.log.info(
            "Added dataset loader cell for %s in %s",
            resolved_dataset_path.relative_to(DATASET_ROOT).as_posix(),
            resolved_notebook_path.relative_to(notebook_root).as_posix(),
        )
        self.finish(
            json.dumps(
                {
                    "status": "ok",
                    "dataset_file": resolved_dataset_path.relative_to(DATASET_ROOT)
                    .as_posix(),
                    "notebook_path": resolved_notebook_path.relative_to(
                        notebook_root
                    ).as_posix(),
                    "dataset_name": dataset_name,
                    "format": table_format,
                    "cell_index": cell_index,
                    "cell_source": cell_source,
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
        (
            url_path_join(base_url, "jupyter-dataset", "notebooks"),
            NotebookListHandler,
        ),
        (
            url_path_join(base_url, "jupyter-dataset", "apply"),
            ApplyDatasetHandler,
        ),
    ]
    web_app.add_handlers(host_pattern, handlers)
