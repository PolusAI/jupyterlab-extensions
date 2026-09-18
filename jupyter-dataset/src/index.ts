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

function buildLoaderSnippet(
  datasetName: string,
  tableFormat: string,
  includePreview = false
): string {
  const lines = [
    'from notebooks_data import Dataset',
    '',
    `loaded_dataset = Dataset.get(${JSON.stringify(datasetName)}).read_table(format=${JSON.stringify(tableFormat)})`
  ];
  if (includePreview && tableFormat === 'pandas') {
    lines.push('loaded_dataset.head()');
  }
  return lines.join('\n');
}

class DatasetSidebar extends Widget {
  private static readonly TABLE_FORMAT_OPTIONS = ['pandas', 'numpy'] as const;
  private static readonly DEFAULT_TABLE_FORMAT = 'pandas';

  private readonly statusNode = document.createElement('div');
  private readonly copySnippetButton = document.createElement('button');
  private readonly refreshButton = document.createElement('button');
  private readonly tilesContainer = document.createElement('div');
  private readonly formatSelect = document.createElement('select');
  private readonly formatControl = document.createElement('div');
  private readonly formatLabel = document.createElement('div');

  private datasets: IDatasetEntry[] = [];
  private activeDatasetFilePath = '';
  private activeDatasetName = '';
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
      'Copy a loader snippet to paste into any notebook cell.';
    this.node.appendChild(this.formatLabel);

    const actionRow = document.createElement('div');
    actionRow.className = 'jp-DatasetsActions';
    this.refreshButton.className = 'jp-Button jp-mod-styled';
    this.refreshButton.textContent = 'Refresh';
    this.copySnippetButton.className =
      'jp-Button jp-mod-styled jp-DatasetsCopySnippetButton';
    this.copySnippetButton.textContent = 'Copy\u00A0snippet';
    actionRow.appendChild(this.refreshButton);
    actionRow.appendChild(this.copySnippetButton);
    this.node.appendChild(actionRow);

    this.statusNode.className = 'jp-DatasetsStatus';
    this.statusNode.textContent = 'Loading datasets...';
    this.node.appendChild(this.statusNode);

    this.refreshButton.onclick = () => {
      void this.refresh();
    };
    this.copySnippetButton.onclick = () => {
      void this.copySnippet();
    };
  }

  private isReadyToCopySnippet(): boolean {
    return Boolean(this.activeDatasetName);
  }

  private updateActionState(): void {
    const isReadyToCopy = this.isReadyToCopySnippet();
    this.copySnippetButton.disabled = !isReadyToCopy;
    this.copySnippetButton.classList.toggle(
      'jp-DatasetsCopySnippetButton-ready',
      isReadyToCopy
    );
    this.copySnippetButton.classList.toggle(
      'jp-DatasetsCopySnippetButton-disabled',
      !isReadyToCopy
    );
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
    this.setStatus('Loading datasets...', 'info');
    this.refreshButton.disabled = true;
    try {
      const datasetResponse = await requestAPI<IDatasetListResponse>('datasets');
      this.datasets = datasetResponse.datasets;
      this.renderDatasetTiles();
      this.updateActionState();
      this.setStatus(`Loaded ${this.datasets.length} dataset(s).`, 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error while refreshing.';
      this.setStatus(message, 'error');
    } finally {
      this.refreshButton.disabled = false;
      this.updateActionState();
    }
  }

  private async copySnippet(): Promise<void> {
    const datasetName = this.activeDatasetName;
    if (!datasetName) {
      this.setStatus('Select a dataset before copying a snippet.', 'error');
      return;
    }

    const snippet = buildLoaderSnippet(
      datasetName,
      this.activeTableFormat,
      true
    );

    this.copySnippetButton.disabled = true;
    this.setStatus('Copying loader snippet...', 'info');
    try {
      await navigator.clipboard.writeText(snippet);
      this.setStatus(
        `Copied loader snippet for "${datasetName}" to clipboard.`,
        'success'
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to copy snippet.';
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
