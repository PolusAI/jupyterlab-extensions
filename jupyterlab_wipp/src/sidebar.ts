import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker, NotebookActions, NotebookPanel } from '@jupyterlab/notebook'
import { ConsolePanel, IConsoleTracker } from '@jupyterlab/console';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Widget, PanelLayout } from '@phosphor/widgets';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
//import { Drag } from '@phosphor/dragdrop';

function ApiRequest<T>(
    url: string,
    request: Object | null,
    settings: ServerConnection.ISettings
  ): Promise<T> {
    return ServerConnection.makeRequest(url, request, settings).then(response => {
      if (response.status !== 200) {
        return response.json().then(data => {
          throw new ServerConnection.ResponseError(response, data.message);
        });
      }
      return response.json();
    });
  }

export interface IWippImageCollection {
    id: string, 
    name: string,
    creationDate: string,
    sourceJob: string,
    locked: boolean,
    pattern: any,
    numberOfImages: number,
    imagesTotalSize: number,
    numberImportingImages: number,
    numberOfImportErrors: number,
    numberOfMetadataFiles: number,
    metadataFilesTotalSize: number,
    _links: Object
  }

/**
 * Sidebar widget for displaying WIPP image collections.
 */
export class WippSidebar extends Widget {
    /**
     * Create a new WIPP sidebar.
     */
    constructor(
      app: JupyterFrontEnd,
      notebookTracker: INotebookTracker,
      consoleTracker: IConsoleTracker,
    ) {
        super();
        this.addClass('wipp-WippSidebar');
        let layout = (this.layout = new PanelLayout());
        //layout.addWidget(this._dashboard);

        // Make request to the backend API
        const settings = ServerConnection.makeSettings();
        const requestUrl = URLExt.join(settings.baseUrl, '/wipp/imageCollections');

        // Display results of API request
        ApiRequest<IWippImageCollection[]>(requestUrl, {}, settings)
        .then((objectArray) => {
            let fieldTitles: string[] = ['Name', 'ID', '# of images', 'Total size', ''];

            const wrapper = new Widget();
            wrapper.addClass('wipp-WippSidebar-table');

            this._table = document.createElement('table');

            let thead = document.createElement('thead');
            let thr = document.createElement('tr');
            fieldTitles.forEach((fieldTitle) => {
                let th = document.createElement('th');
                th.appendChild(document.createTextNode(fieldTitle));
                thr.appendChild(th);
            });
            thead.appendChild(thr);
            this._table.appendChild(thead);

            let tbdy = document.createElement('tbody');
            objectArray.forEach((object) => {
                let tr = document.createElement('tr');

                var td = document.createElement('td');
                td.appendChild(document.createTextNode(object.name));
                tr.appendChild(td);
                var td = document.createElement('td');
                td.appendChild(document.createTextNode(object.id));
                tr.appendChild(td);
                var td = document.createElement('td');
                td.appendChild(document.createTextNode(object.numberOfImages.toString()));
                tr.appendChild(td);
                var td = document.createElement('td');
                td.appendChild(document.createTextNode(object.imagesTotalSize.toString()));
                tr.appendChild(td);
                var td = document.createElement('td');
                var button = document.createElement("button");
                button.innerHTML = "Add code";
                button.addEventListener ("click", function() {
                  const id = object.id;
                  console.log(id);

                  //Inject the code in the editor
                  const editor = getCurrentEditor(
                    app,
                    notebookTracker,
                    consoleTracker
                  );
                  insertInputPath(editor, "'/opt/shared/wipp/collections/"+id+"/images/'");
                });
                td.appendChild(button);
                tr.appendChild(td);

                tbdy.appendChild(tr);    
            });

            this._table.appendChild(tbdy);
            wrapper.node.appendChild(this._table);
            layout.addWidget(wrapper);

        })
    }

    private _table: HTMLTableElement;
}


/**
   * Insert collection input path.
   */
  export function insertInputPath(
    editor: CodeEditor.IEditor,
    collection_path: string
  ): void {
    const cursor = editor.getCursorPosition();
    const offset = editor.getOffsetAt(cursor);
    const code = `input_path = ${collection_path}`;
    editor.model.value.insert(offset, code);
  }

/**
 * Get the currently focused editor in the application,
 * checking both notebooks and consoles.
 * In the case of a notebook, it creates a new cell above the currently
 * active cell and then returns that.
 */
export function getCurrentEditor(
  app: JupyterFrontEnd,
  notebookTracker: INotebookTracker,
  consoleTracker: IConsoleTracker
): CodeEditor.IEditor | null | undefined {
  // Get a handle on the most relevant kernel,
  // whether it is attached to a notebook or a console.
  let current = app.shell.currentWidget;
  let editor: CodeEditor.IEditor | null | undefined;
  if (current && notebookTracker.has(current)) {
    NotebookActions.insertAbove((current as NotebookPanel).content);
    const cell = (current as NotebookPanel).content.activeCell;
    editor = cell && cell.editor;
  } else if (current && consoleTracker.has(current)) {
    const cell = (current as ConsolePanel).console.promptCell;
    editor = cell && cell.editor;
  } else if (notebookTracker.currentWidget) {
    const current = notebookTracker.currentWidget;
    NotebookActions.insertAbove(current.content);
    const cell = current.content.activeCell;
    editor = cell && cell.editor;
  } else if (consoleTracker.currentWidget) {
    const current = consoleTracker.currentWidget;
    const cell = current.console.promptCell;
    editor = cell && cell.editor;
  }
  return editor;
}