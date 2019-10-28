import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker, NotebookActions, NotebookPanel } from '@jupyterlab/notebook'
import { ConsolePanel, IConsoleTracker } from '@jupyterlab/console';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Widget, PanelLayout } from '@phosphor/widgets';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
import { Cell } from '@jupyterlab/cells';

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

        const settings = ServerConnection.makeSettings();
        var requestUrl = URLExt.join(settings.baseUrl, '/wipp/ui_urls');

        var imagescollection_url: string;
        // Return results of API request
        ApiRequest<any>(requestUrl, {}, settings)
        .then(response => { imagescollection_url = response.imagescollection; })

        // Make request to the backend API
        requestUrl = URLExt.join(settings.baseUrl, '/wipp/imageCollections');

        // Display results of API request
        ApiRequest<IWippImageCollection[]>(requestUrl, {}, settings)
        .then((objectArray) => {
            let fieldTitles: string[] = ['Name', '# of images', 'Total size', ''];

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
                // var name = document.createTextNode(object.name);
                
                var name = document.createElement('a');
                name.href = imagescollection_url + object.id;
                name.target = '_blank';
                name.appendChild(document.createTextNode(object.name));

                td.appendChild(name);
                tr.appendChild(td);
                var td = document.createElement('td');
                td.appendChild(document.createTextNode(object.numberOfImages.toString()));
                tr.appendChild(td);
                var td = document.createElement('td');
                var sizeof = (bytes: number) => {
                  if (bytes == 0) { return "0.00 B"; }
                  var e = Math.floor(Math.log(bytes) / Math.log(1024));
                  return (bytes/Math.pow(1024, e)).toFixed(0)+' '+' KMGTP'.charAt(e)+'B';
                }
                td.appendChild(document.createTextNode(sizeof(object.imagesTotalSize)));
                tr.appendChild(td);
                var td = document.createElement('td');
                var button = document.createElement("button");
                button.innerHTML = "Import";
                button.addEventListener ("click", function() {
                  //Inject the code in the editor
                  const editor = getCurrentEditor(app,notebookTracker,consoleTracker
                  );
                  if (editor){
                    insertInputPath(editor, "'/opt/shared/wipp/collections/"+object.id+"/images/'");
                  };
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
  // Get a handle on the most relevant editor,
  // whether it is attached to a notebook or a console.
  let current = app.shell.currentWidget;
  var cell: Cell;
  if (current && notebookTracker.has(current)) { //when editing notebook
    NotebookActions.insertAbove((current as NotebookPanel).content);
    cell = (current as NotebookPanel).content.activeCell;
    cell.model.metadata.set('tags', ["parameters"]); //set special metadata for Notebook executor plugin
  } else if (current && consoleTracker.has(current)) { //when using code console
    cell = (current as ConsolePanel).console.promptCell;
  }
  return cell && cell.editor;
}