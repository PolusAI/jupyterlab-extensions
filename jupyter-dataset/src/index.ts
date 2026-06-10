import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Widget } from '@lumino/widgets';

import { requestAPI } from './handler';

interface IFileEntry {
  name: string;
  path: string;
  size_bytes: number;
}

interface IDatasetEntry {
  name: string;
  path: string;
  files: IFileEntry[];
}

interface IDatasetListResponse {
  dataset_root: string;
  supported_extensions: string[];
  datasets: IDatasetEntry[];
}

interface INotebookListResponse {
  notebook_root: string;
  notebooks: string[];
}

interface IApplyResponse {
  status: string;
  dataset_file: string;
  notebook_path: string;
  dataset_name: string;
  format: string;
  cell_index: number;
  cell_source: string;
}

class DatasetSidebar extends Widget {
  private static readonly TABLE_FORMAT_OPTIONS = ['pandas', 'numpy'] as const;
  private static readonly DEFAULT_TABLE_FORMAT = 'pandas';

  private readonly statusNode = document.createElement('div');
  private readonly applyButton = document.createElement('button');
  private readonly refreshButton = document.createElement('button');
  private readonly tilesContainer = document.createElement('div');
  private readonly notebookSelect = document.createElement('select');
  private readonly notebookControl = document.createElement('div');
  private readonly formatSelect = document.createElement('select');
  private readonly formatControl = document.createElement('div');
  private readonly formatLabel = document.createElement('div');

  private datasets: IDatasetEntry[] = [];
  private notebooks: string[] = [];
  private activeDatasetFilePath = '';
  private activeDatasetName = '';
  private activeNotebookPath = '';
  private activeTableFormat = DatasetSidebar.DEFAULT_TABLE_FORMAT;

  constructor() {
    super();
    this.id = 'jupyter-dataset-sidebar';
    this.title.label = 'Datasets';
    this.title.caption = 'Dataset operations';
    this.title.closable = true;
    this.addClass('jp-DatasetsSidebar');

    this.tilesContainer.className = 'jp-DatasetsTiles';
    this.node.appendChild(this.tilesContainer);
    this.renderDatasetTiles();

    this.notebookControl.className = 'jp-DatasetsControl';
    const notebookLabel = document.createElement('label');
    notebookLabel.className = 'jp-DatasetsLabel';
    notebookLabel.textContent = 'Notebook';
    this.notebookSelect.className = 'jp-DatasetsSelect';
    this.notebookSelect.onchange = () => {
      this.activeNotebookPath = this.notebookSelect.value;
      this.updateActionState();
    };
    this.notebookControl.appendChild(notebookLabel);
    this.notebookControl.appendChild(this.notebookSelect);
    this.node.appendChild(this.notebookControl);

    this.formatControl.className = 'jp-DatasetsControl';
    const formatSelectLabel = document.createElement('label');
    formatSelectLabel.className = 'jp-DatasetsLabel';
    formatSelectLabel.textContent = 'Dataframe type';
    this.formatSelect.className = 'jp-DatasetsSelect';
    DatasetSidebar.TABLE_FORMAT_OPTIONS.forEach(format => {
      const option = document.createElement('option');
      option.value = format;
      option.textContent = format;
      option.selected = format === DatasetSidebar.DEFAULT_TABLE_FORMAT;
      this.formatSelect.appendChild(option);
    });
    this.formatSelect.onchange = () => {
      this.activeTableFormat = this.formatSelect.value;
    };
    this.formatControl.appendChild(formatSelectLabel);
    this.formatControl.appendChild(this.formatSelect);
    this.node.appendChild(this.formatControl);

    this.formatLabel.className = 'jp-DatasetsHint';
    this.formatLabel.textContent =
      'Apply inserts a loader cell with the selected dataframe type.';
    this.node.appendChild(this.formatLabel);

    const actionRow = document.createElement('div');
    actionRow.className = 'jp-DatasetsActions';
    this.refreshButton.className = 'jp-Button jp-mod-styled';
    this.refreshButton.textContent = 'Refresh';
    this.applyButton.className = 'jp-Button jp-mod-styled jp-DatasetsApplyButton';
    this.applyButton.textContent = 'Apply';
    actionRow.appendChild(this.refreshButton);
    actionRow.appendChild(this.applyButton);
    this.node.appendChild(actionRow);

    this.statusNode.className = 'jp-DatasetsStatus';
    this.statusNode.textContent = 'Loading datasets and notebooks...';
    this.node.appendChild(this.statusNode);

    this.refreshButton.onclick = () => {
      void this.refresh();
    };
    this.applyButton.onclick = () => {
      void this.apply();
    };
  }

  private isReadyToApply(datasetPath = this.activeDatasetFilePath): boolean {
    return Boolean(datasetPath && this.activeDatasetName && this.activeNotebookPath);
  }

  private ensureActiveNotebookSelection(): void {
    if (!this.notebooks.includes(this.activeNotebookPath)) {
      this.activeNotebookPath = this.notebooks[0] ?? '';
    }
  }

  private renderNotebookControl(): void {
    this.notebookSelect.replaceChildren();
    this.notebooks.forEach(notebookPath => {
      const option = document.createElement('option');
      option.value = notebookPath;
      option.textContent = notebookPath;
      option.selected = notebookPath === this.activeNotebookPath;
      this.notebookSelect.appendChild(option);
    });

    this.notebookSelect.disabled = this.notebooks.length === 0;
  }

  private updateActionState(): void {
    const isReady = this.isReadyToApply();
    this.applyButton.disabled = !isReady;
    this.applyButton.classList.toggle('jp-DatasetsApplyButton-ready', isReady);
    this.applyButton.classList.toggle('jp-DatasetsApplyButton-disabled', !isReady);
  }

  private renderDatasetTiles(): void {
    this.tilesContainer.replaceChildren();

    const hasActiveFile = this.datasets.some(dataset =>
      dataset.files.some(file => file.path === this.activeDatasetFilePath)
    );
    if (!hasActiveFile) {
      this.activeDatasetFilePath = '';
      this.activeDatasetName = '';
    }

    if (this.datasets.length === 0) {
      const msg = document.createElement('div');
      msg.className = 'jp-DatasetsTileEmpty';
      msg.textContent = 'No datasets found';
      this.tilesContainer.appendChild(msg);
      return;
    }
    this.datasets.forEach(dataset => {
      const tile = document.createElement('section');
      tile.className = 'jp-DatasetsTile';
      const title = document.createElement('div');
      title.className = 'jp-DatasetsTileTitle';
      title.textContent = dataset.name;
      const meta = document.createElement('div');
      meta.className = 'jp-DatasetsTileMeta';
      meta.textContent = `${dataset.files.length} file(s)`;
      const filesContainer = document.createElement('div');
      filesContainer.className = 'jp-DatasetsFileButtons';
      const hasFiles = dataset.files.length > 0;
      const isActiveDataset =
        hasFiles && dataset.files.some(file => file.path === this.activeDatasetFilePath);
      let selectedFilePath = '';

      if (isActiveDataset) {
        tile.classList.add('jp-DatasetsTile-active');
      }

      if (hasFiles) {
        selectedFilePath =
          dataset.files.find(file => file.path === this.activeDatasetFilePath)?.path ?? '';
        tile.onclick = () => {
          if (!isActiveDataset) {
            this.activeDatasetFilePath = dataset.files[0].path;
            this.activeDatasetName = dataset.name;
            this.renderDatasetTiles();
            this.updateActionState();
          }
        };

        dataset.files.forEach(file => {
          const fileButton = document.createElement('button');
          fileButton.className = 'jp-Button jp-mod-styled jp-DatasetsFileButton';
          if (file.path === selectedFilePath && isActiveDataset) {
            fileButton.classList.add('jp-DatasetsFileButton-active');
          }
          fileButton.textContent = file.path;
          fileButton.onclick = event => {
            event.stopPropagation();
            this.activeDatasetFilePath = file.path;
            this.activeDatasetName = dataset.name;
            this.renderDatasetTiles();
            this.updateActionState();
          };
          filesContainer.appendChild(fileButton);
        });
      } else {
        const noFiles = document.createElement('div');
        noFiles.className = 'jp-DatasetsTileMeta';
        noFiles.textContent = 'No files available';
        filesContainer.appendChild(noFiles);
      }

      tile.appendChild(title);
      tile.appendChild(meta);
      tile.appendChild(filesContainer);
      this.tilesContainer.appendChild(tile);
    });
  }

  async refresh(): Promise<void> {
    this.setStatus('Loading datasets and notebooks...', 'info');
    this.applyButton.disabled = true;
    this.refreshButton.disabled = true;
    try {
      const [datasetResponse, notebookResponse] = await Promise.all([
        requestAPI<IDatasetListResponse>('datasets'),
        requestAPI<INotebookListResponse>('notebooks')
      ]);
      this.datasets = datasetResponse.datasets;
      this.notebooks = notebookResponse.notebooks;
      this.ensureActiveNotebookSelection();
      this.renderNotebookControl();
      this.renderDatasetTiles();
      this.updateActionState();
      this.setStatus(
        `Loaded ${this.datasets.length} dataset(s) and ${this.notebooks.length} notebook(s).`,
        'success'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error while refreshing.';
      this.setStatus(message, 'error');
    } finally {
      this.refreshButton.disabled = false;
      this.updateActionState();
    }
  }

  private async apply(): Promise<void> {
    const datasetFile = this.activeDatasetFilePath;
    const datasetName = this.activeDatasetName;
    const notebookPath = this.activeNotebookPath;

    if (!datasetFile) {
      this.setStatus('Select a dataset file before applying.', 'error');
      return;
    }
    if (!datasetName) {
      this.setStatus('Select a dataset before applying.', 'error');
      return;
    }
    if (!notebookPath) {
      this.setStatus('Select a notebook before applying.', 'error');
      return;
    }

    this.applyButton.disabled = true;
    this.applyButton.classList.add('jp-DatasetsApplyButton-disabled');
    this.applyButton.classList.remove('jp-DatasetsApplyButton-ready');
    this.setStatus('Adding dataset loader cell to notebook...', 'info');
    try {
      const response = await requestAPI<IApplyResponse>('apply', {
        method: 'POST',
        body: JSON.stringify({
          dataset_file: datasetFile,
          dataset_name: datasetName,
          notebook_path: notebookPath,
          format: this.activeTableFormat
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      this.setStatus(
        `Added loader cell (#${response.cell_index}) for "${response.dataset_name}" in ${response.notebook_path}.`,
        'success'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apply failed.';
      this.setStatus(message, 'error');
    } finally {
      this.updateActionState();
    }
  }

  private setStatus(message: string, kind: 'info' | 'success' | 'error'): void {
    this.statusNode.textContent = message;
    this.statusNode.dataset.kind = kind;
  }
}

/**
 * Initialization data for the jupyter-dataset extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyter-dataset:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    const sidebar = new DatasetSidebar();
    app.shell.add(sidebar, 'left', { rank: 850 });
    void sidebar.refresh();
  }
};

export default plugin;
