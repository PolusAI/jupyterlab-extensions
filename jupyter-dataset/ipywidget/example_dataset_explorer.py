"""Notebook widget for browsing tabular datasets mounted in /opt/datasets."""

from __future__ import annotations

import importlib
from pathlib import Path

try:
    _ipython_display = importlib.import_module("IPython.display")
    HTML = _ipython_display.HTML
    display = _ipython_display.display
except ModuleNotFoundError:  # pragma: no cover - depends on notebook env
    class HTML(str):
        """Fallback HTML wrapper when IPython is unavailable."""

    def display(*objects) -> None:
        for obj in objects:
            print(obj)

try:
    widgets = importlib.import_module("ipywidgets")
except ModuleNotFoundError:  # pragma: no cover - depends on notebook env
    widgets = None

from ipywidget.dataframe_io import (
    EmptyDataError,
    SUPPORTED_EXTENSIONS,
    human_size,
    iter_supported_files,
    list_dataset_dirs,
    pd,
    read_dataframe,
    require_pandas,
    write_dataframe,
)


DEFAULT_DATASET_ROOT = Path("/opt/datasets")


class DatasetExplorerWidget:
    """Interactive notebook explorer for mounted datasets."""

    def __init__(self, dataset_root: str | Path = DEFAULT_DATASET_ROOT, preview_rows: int = 20):
        if widgets is None:
            raise ModuleNotFoundError(
                "ipywidgets is not installed. Install it with `pip install ipywidgets` "
                "or via your Jupyter environment package manager."
            )
        require_pandas()

        self.dataset_root = Path(dataset_root)
        self.preview_rows = max(1, int(preview_rows))

        self.dataset_dropdown = widgets.Dropdown(description="Dataset", options=[])
        self.file_dropdown = widgets.Dropdown(description="File", options=[])
        self.preview_rows_input = widgets.BoundedIntText(
            value=self.preview_rows,
            min=1,
            max=10000,
            step=1,
            description="Rows",
        )
        self.refresh_button = widgets.Button(description="Refresh", button_style="info")
        self.load_button = widgets.Button(description="Load Preview", button_style="success")
        self.apply_button = widgets.Button(description="Apply Cell", button_style="warning")
        self.cell_editor = widgets.Textarea(
            value=(
                "# Use `df` as your input DataFrame.\n"
                "# Set `result` to the transformed DataFrame.\n"
                "result = df\n"
            ),
            description="Cell",
            layout=widgets.Layout(width="100%", height="170px"),
        )
        self.status = widgets.HTML("")
        self.output = widgets.Output(layout={"border": "1px solid #ddd", "padding": "6px"})

        self.dataset_dropdown.observe(self._on_dataset_change, names="value")
        self.preview_rows_input.observe(self._on_preview_rows_change, names="value")
        self.refresh_button.on_click(self._on_refresh_click)
        self.load_button.on_click(self._on_load_click)
        self.apply_button.on_click(self._on_apply_click)

        self._refresh_datasets()

    def render(self) -> widgets.VBox:
        """Return the top-level widget container."""
        controls = widgets.HBox([self.dataset_dropdown, self.file_dropdown])
        actions = widgets.HBox(
            [self.preview_rows_input, self.refresh_button, self.load_button, self.apply_button]
        )
        return widgets.VBox([controls, actions, self.cell_editor, self.status, self.output])

    def _set_status(self, message: str, level: str = "info") -> None:
        color_by_level = {
            "info": "#0b5ed7",
            "success": "#146c43",
            "warning": "#997404",
            "error": "#b02a37",
        }
        color = color_by_level.get(level, color_by_level["info"])
        self.status.value = f"<span style='color: {color};'><strong>{message}</strong></span>"

    def _on_preview_rows_change(self, change: dict) -> None:
        self.preview_rows = max(1, int(change["new"]))

    def _on_refresh_click(self, _button: object) -> None:
        self._refresh_datasets()

    def _on_load_click(self, _button: object) -> None:
        self._load_selected_file()

    def _on_apply_click(self, _button: object) -> None:
        self._apply_cell_to_selected_file()

    def _on_dataset_change(self, _change: dict) -> None:
        self._refresh_files()

    def _refresh_datasets(self) -> None:
        dataset_infos = list_dataset_dirs(self.dataset_root)
        if not dataset_infos:
            self.dataset_dropdown.options = [("<no datasets found>", "")]
            self.dataset_dropdown.value = ""
            self.file_dropdown.options = [("<no files found>", "")]
            self.file_dropdown.value = ""
            if not self.dataset_root.exists():
                self._set_status(
                    f"Dataset root does not exist: {self.dataset_root}",
                    level="warning",
                )
            else:
                self._set_status(
                    f"No dataset folders found in {self.dataset_root}",
                    level="warning",
                )
            with self.output:
                self.output.clear_output()
            return

        self.dataset_dropdown.options = [(info.name, str(info.path)) for info in dataset_infos]
        self.dataset_dropdown.value = str(dataset_infos[0].path)
        self._set_status(
            f"Found {len(dataset_infos)} dataset folder(s) in {self.dataset_root}",
            level="success",
        )
        self._refresh_files()

    def _refresh_files(self) -> None:
        dataset_value = self.dataset_dropdown.value or ""
        dataset_path = Path(dataset_value) if dataset_value else None

        if dataset_path is None or not dataset_path.exists():
            self.file_dropdown.options = [("<no files found>", "")]
            self.file_dropdown.value = ""
            self._set_status("Select a dataset folder to list files.", level="info")
            return

        files = list(iter_supported_files(dataset_path))
        if not files:
            self.file_dropdown.options = [("<no supported files found>", "")]
            self.file_dropdown.value = ""
            self._set_status(
                f"No supported tabular files in {dataset_path}. "
                f"Supported: {', '.join(SUPPORTED_EXTENSIONS)}",
                level="warning",
            )
            return

        self.file_dropdown.options = [
            (str(file_path.relative_to(dataset_path)), str(file_path)) for file_path in files
        ]
        self.file_dropdown.value = str(files[0])
        self._set_status(f"Found {len(files)} supported file(s).", level="success")

    def _load_selected_file(self) -> None:
        file_value = self.file_dropdown.value or ""
        if not file_value:
            self._set_status("No file selected.", level="warning")
            return

        file_path = Path(file_value)
        if not file_path.exists():
            self._set_status(f"File not found: {file_path}", level="error")
            return

        with self.output:
            self.output.clear_output()
            try:
                dataframe = read_dataframe(file_path, self.preview_rows)
            except EmptyDataError:
                self._set_status(f"File is empty: {file_path}", level="warning")
                display(HTML(f"<p><strong>{file_path.name}</strong> is empty.</p>"))
                return
            except Exception as exc:  # broad by design for notebook UX
                self._set_status(f"Failed to read file: {exc}", level="error")
                display(HTML(f"<pre>{type(exc).__name__}: {exc}</pre>"))
                return

            file_size = human_size(file_path.stat().st_size)
            metadata_html = (
                "<div>"
                f"<p><strong>Path:</strong> {file_path}</p>"
                f"<p><strong>Size:</strong> {file_size}</p>"
                f"<p><strong>Preview rows shown:</strong> {len(dataframe)}</p>"
                f"<p><strong>Columns:</strong> {len(dataframe.columns)}</p>"
                "</div>"
            )
            display(HTML(metadata_html))
            if not dataframe.empty:
                dtype_frame = dataframe.dtypes.rename("dtype").to_frame()
                display(HTML("<p><strong>Column types:</strong></p>"))
                display(dtype_frame)
            display(HTML("<p><strong>Data preview:</strong></p>"))
            display(dataframe)

            self._set_status(f"Loaded {file_path.name} successfully.", level="success")

    def _apply_cell_to_selected_file(self) -> None:
        file_value = self.file_dropdown.value or ""
        if not file_value:
            self._set_status("No file selected.", level="warning")
            return

        transform_code = self.cell_editor.value.strip()
        if not transform_code:
            self._set_status("Cell code is empty.", level="warning")
            return

        file_path = Path(file_value)
        if not file_path.exists():
            self._set_status(f"File not found: {file_path}", level="error")
            return

        with self.output:
            self.output.clear_output()
            try:
                original_df = read_dataframe(file_path, preview_rows=None)
                execution_scope = {"df": original_df.copy(), "pd": pd}
                exec(transform_code, {}, execution_scope)
                result_df = execution_scope.get("result", execution_scope["df"])
                if not isinstance(result_df, pd.DataFrame):
                    raise TypeError("Cell must produce a pandas DataFrame in `result`.")
                write_dataframe(file_path, result_df)
                preview_df = result_df.head(self.preview_rows)
            except EmptyDataError:
                self._set_status(f"File is empty: {file_path}", level="warning")
                display(HTML(f"<p><strong>{file_path.name}</strong> is empty.</p>"))
                return
            except Exception as exc:  # broad by design for notebook UX
                self._set_status(f"Apply failed: {exc}", level="error")
                display(HTML(f"<pre>{type(exc).__name__}: {exc}</pre>"))
                return

            display(
                HTML(
                    "<p><strong>Applied transform and wrote file:</strong> "
                    f"{file_path}</p>"
                )
            )
            display(HTML("<p><strong>Updated preview:</strong></p>"))
            display(preview_df)
            self._set_status(f"Applied transform to {file_path.name}.", level="success")


def display_dataset_explorer(
    dataset_root: str | Path = DEFAULT_DATASET_ROOT, preview_rows: int = 20
) -> DatasetExplorerWidget:
    """Create and display the dataset explorer in a notebook cell."""
    explorer = DatasetExplorerWidget(dataset_root=dataset_root, preview_rows=preview_rows)
    display(explorer.render())
    return explorer

