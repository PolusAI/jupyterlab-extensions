import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker, NotebookActions, NotebookPanel } from '@jupyterlab/notebook'
import { ConsolePanel, IConsoleTracker } from '@jupyterlab/console';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Widget, PanelLayout } from '@phosphor/widgets';
import { ServerConnection } from '@jupyterlab/services';
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { URLExt } from '@jupyterlab/coreutils';
import { Cell } from '@jupyterlab/cells';
import { Signal } from '@phosphor/signaling';

import { IGenericCollection, ITableSignal } from './types'
import { GenericTableWidget } from './components/tableWidget'
import { SearchWidget } from './components/searchWidget'
import { SwitcherWidget } from './components/collectionTypeSwitcherWidget'

import React from 'react';

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
        this.app = app;
        this.notebookTracker = notebookTracker;
        this.consoleTracker = consoleTracker;

        this._tableState = {
          collections_array: this._objectArray,
          code_injector: this.handleClick,
          tableHeader: this._tableHeader,
          collection_url_prefix: this._collection_url_prefix
        }

        this.addClass('wipp-WippSidebar');

        // Call API to get UI URLs
        this._getUiUrls();


        // Define Widget layout
        let layout = (this.layout = new PanelLayout());

        // Add search bar widget for search WIPP Collections
        this._search = new SearchWidget(() => this.get_search_placeholder(), (arg0) => this._searchCollections(arg0));
        layout.addWidget(this._search);

        // Add buttons to choose type of WIPP Collection
        this._switcher = new SwitcherWidget((arg0) => this.swithchCollectionType(arg0));
        layout.addWidget(this._switcher);

        // Add ReactWidget for table of WIPP Collections
        this._table = ReactWidget.create (
          <UseSignal signal={this._valueChanged} initialArgs={this._tableState}>
            {(_, oa) => <GenericTableWidget
              ar={oa.collections_array}
              codeInjector={oa.code_injector}
              tableHeader={oa.tableHeader}
              collectionUrl={oa.collection_url_prefix}
            ></GenericTableWidget>}
          </UseSignal>
        )
        this._table.addClass('wipp-WippSidebar-table-div');
        layout.addWidget(this._table);

        this.swithchCollectionType(1);

    }

    private swithchCollectionType(choice: number){
      var app = this.app;
      var notebookTracker = this.notebookTracker;
      var consoleTracker = this.consoleTracker;

      var file_path_prefix: string;
      var file_path_suffix: string;

      switch(choice){
        case 1: { // Show Image Collections
          this._search_collection_type_url = '/wipp/imageCollections/search';
          this._get_collection_type_url = '/wipp/imageCollections';
          file_path_prefix = "'/opt/shared/wipp/collections/";
          file_path_suffix = "/images/'";

          // specify table header
          this._tableHeader = [['name', 'Name'], ['numberOfImages', '# of images'], ['imagesTotalSize', 'Total size'], ['creationDate', 'Creation date']];

          // set search bar placeholder
          this._search_placeholder = 'SEARCH IMAGE COLLECTIONS';

          // set collection UI url prefix
          this._collection_url_prefix = this._imagescollection_url;

          break;
        }
        case 2: { // Show CSV Collections
          this._search_collection_type_url = '/wipp/csvCollections/search';
          this._get_collection_type_url = '/wipp/csvCollections';
          file_path_prefix = "'/opt/shared/wipp/csv-collections/";
          file_path_suffix = "'";
          
          // specify table header
          this._tableHeader = [['name', 'Name'], ['creationDate', 'Creation date']];

          // set search bar placeholder
          this._search_placeholder = 'SEARCH CSV COLLECTIONS';

          // set collection UI url prefix
          this._collection_url_prefix = this._csvcollections_url;

          break;
        }
      }

      // define function for pasting code to current editor
      this.handleClick = function handleClick(id: string) {
        const editor = getCurrentEditor(app, notebookTracker, consoleTracker);
        if (editor){
          insertInputPath(editor, file_path_prefix + id + file_path_suffix);
        };
      }

      // Update search bar
      this._search.update();

      // Update Table with the new type immediately
      this._tableState.tableHeader = this._tableHeader;
      this._tableState.code_injector = this.handleClick;
      this._tableState.collection_url_prefix = this._collection_url_prefix;
      this._getAllCollections();
    }

    private async _getUiUrls() {
      const settings = ServerConnection.makeSettings();
      var requestUrl = URLExt.join(settings.baseUrl, '/wipp/ui_urls');

      // Return results of API request
      ApiRequest<any>(requestUrl, {}, settings)
      .then(response => { 
        this._imagescollection_url = response.imagescollection;
        this._csvcollections_url = response.csvcollections;
      })
    }

    private async _getAllCollections(){
      // Set up request settings
      const settings = ServerConnection.makeSettings();

      // Create request URL
      var requestUrl = URLExt.join(settings.baseUrl, this._get_collection_type_url);
      
      // Display results of API request
      ApiRequest<IGenericCollection[]>(requestUrl, {}, settings)
      .then((objectArray) => {
          // Update internal variable
          this._objectArray = objectArray;
          this._tableState.collections_array = objectArray;
          
          // Send signal for table widget to update data
          this._valueChanged.emit(this._tableState);

      })
    }

    private async _searchCollections(name: string){
      const settings = ServerConnection.makeSettings();
      var requestUrl = URLExt.join(settings.baseUrl, this._search_collection_type_url);

      // Make request to the backend API
      var request = {
        name: name,
      };
      var fullRequest = {
          method: 'POST',
          body: JSON.stringify(request)
      };
      ApiRequest<IGenericCollection[]>(requestUrl, fullRequest, settings)
      .then((objectArray) => {
        if(JSON.stringify(objectArray) == JSON.stringify(this._objectArray)){
          return;
        }

        // Update internal variable
        this._objectArray = objectArray;
        this._tableState.collections_array = objectArray;
        
        // Send signal for table widget to update data
        this._valueChanged.emit(this._tableState);
      });

    }

    private get_search_placeholder(): string {
      return this._search_placeholder;
    }

    private app: JupyterFrontEnd;
    private notebookTracker: INotebookTracker;
    private consoleTracker: IConsoleTracker;
    private _get_collection_type_url: string;
    private _search_collection_type_url: string;
    private _search: SearchWidget;
    private _switcher: SwitcherWidget;
    private _table: ReactWidget;
    private _imagescollection_url: string;
    private _csvcollections_url: string;
    private _collection_url_prefix: string = '';
    private _objectArray: IGenericCollection[] = [];
    private _tableHeader: [keyof IGenericCollection, string][] = [];
    private _search_placeholder: string = '';
    private handleClick: (id: string)=>void = () => {};
    private _tableState: ITableSignal;
    private _valueChanged = new Signal<this, ITableSignal>(this);
}

/**
   * Insert WIPP Collection path code into editor
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