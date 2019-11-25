import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker, NotebookActions, NotebookPanel } from '@jupyterlab/notebook'
import { ConsolePanel, IConsoleTracker } from '@jupyterlab/console';
import { CodeEditor } from '@jupyterlab/codeeditor';
import { Widget, PanelLayout } from '@phosphor/widgets';
import { ServerConnection } from '@jupyterlab/services';
import { ToolbarButton, ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { URLExt } from '@jupyterlab/coreutils';
import { Cell } from '@jupyterlab/cells';
import { Signal } from '@phosphor/signaling';

import React, { Component } from 'react';

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

export interface ITableSignal {
  collections_array: IGenericCollection[],
  code_injector: (id: string) => void;
  tableHeader: [keyof IGenericCollection, string][];
  collection_url_prefix: string;
}

// Generic interface for any type of WIPP Collections
export interface IGenericCollection {
  id: string,
  [key: string]: any
}

// Interface for WIPP Image Collections
export interface IWippImageCollection extends IGenericCollection {
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

// Interface for WIPP CSV Collections
export interface IWippCsvCollection extends IGenericCollection {
  id: string, 
  name: string,
  creationDate: string,
  sourceJob: string,
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
      if (choice==1){ // Show Image Collections
        this._search_collection_type_url = '/wipp/imageCollections/search';
        this._get_collection_type_url = '/wipp/imageCollections';
        
        var app = this.app;
        var notebookTracker = this.notebookTracker;
        var consoleTracker = this.consoleTracker;

        // define function for pasting code to current editor
        this.handleClick = function handleClick(id: string) {
          const editor = getCurrentEditor(app, notebookTracker, consoleTracker);
          if (editor){
            insertInputPath(editor, "'/opt/shared/wipp/collections/" + id + "/images/'");
          };
        }

        // specify table header
        this._tableHeader = [['name', 'Name'], ['numberOfImages', '# of images'], ['imagesTotalSize', 'Total size'], ['creationDate', 'Creation date']];

        // set search bar placeholder
        this._search_placeholder = 'SEARCH IMAGE COLLECTIONS';

        // set collection UI url prefix
        this._collection_url_prefix = this._imagescollection_url;
      }
      else if (choice==2){ // Show CSV Collections
        this._search_collection_type_url = '/wipp/csvCollections/search';
        this._get_collection_type_url = '/wipp/csvCollections';

        var app = this.app;
        var notebookTracker = this.notebookTracker;
        var consoleTracker = this.consoleTracker;

        // define function for pasting code to current editor
        this.handleClick = function handleClick(id: string) {
          const editor = getCurrentEditor(app, notebookTracker, consoleTracker);
          if (editor){
            insertInputPath(editor, "'/opt/shared/wipp/csv-collections/" + id + "'");
          };
        }

        // specify table header
        this._tableHeader = [['name', 'Name'], ['creationDate', 'Creation date']];

        // set search bar placeholder
        this._search_placeholder = 'SEARCH CSV COLLECTIONS';

        // set collection UI url prefix
        this._collection_url_prefix = this._csvcollections_url;
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
 * Switcher widget for choosing WIPP Collection type to explore
 */
class SwitcherWidget extends Widget {
  constructor(
    switchType: (type: number) => void
  ) {
    super();

    const layout = (this.layout = new PanelLayout());

    const switchPanel = new Widget();
    

    var ul=document.createElement('ul');
    ul.className = 'wipp-WippSidebar-switcher-list';

    var li1 = document.createElement('li');
    li1.className = 'wipp-WippSidebar-switcher-item';
    
    this._imageCollectionsButton = document.createElement('button');
    this._imageCollectionsButton.className = 'selected';
    this._imageCollectionsButton.value = 'Image Collections';
    this._imageCollectionsButton.onclick = () => {
      this._imageCollectionsButton.className = 'selected';
      this._csvCollectionsButton.className = 'normal';
      switchType(1);
    };
    this._imageCollectionsButton.innerText = 'Image Collections';

    li1.appendChild(this._imageCollectionsButton);
    ul.appendChild(li1);

    var li2 = document.createElement('li');
    li2.className = 'wipp-WippSidebar-switcher-item';

    this._csvCollectionsButton = document.createElement('button');
    this._csvCollectionsButton.className = 'normal';
    this._csvCollectionsButton.value = 'CSV Collections';
    this._csvCollectionsButton.onclick = () => {
      this._csvCollectionsButton.className = 'selected';
      this._imageCollectionsButton.className = 'normal';
      switchType(2);
    };
    this._csvCollectionsButton.innerText = 'CSV Collections';
    
    li2.appendChild(this._csvCollectionsButton);
    ul.appendChild(li2);

    switchPanel.node.appendChild(ul);
    layout.addWidget(switchPanel);
  }

  private _imageCollectionsButton: HTMLButtonElement;
  private _csvCollectionsButton: HTMLButtonElement;
}


/**
 * Search widget on top of WIPP Panel.
 */
class SearchWidget extends Widget {
  constructor(
      placeholder: () => string,
      updateWidget: (arg0: string) => void
  ){
    super();
    this._getPlaceholder = placeholder;

    this.addClass('wipp-WippSidebar-search-layout');
    const layout = (this.layout = new PanelLayout());
    
    // Search input bar for imageCollections
    const searchBar = new Widget();
    searchBar.addClass('wipp-WippSidebar-search');
    this._searchBar = document.createElement('input');
    this._searchBar.placeholder = this._getPlaceholder();
    this._searchBar.oninput = async () => {
      updateWidget(this._searchBar.value);
    }
    searchBar.node.appendChild(this._searchBar);
    layout.addWidget(searchBar);

    // Clear search bar button
    const clearButton = new ToolbarButton({
      tooltip: 'CLEAR SEARCH BAR:',
      iconClassName: 'wipp-ClearIcon jp-Icon jp-Icon-16',
      onClick: async () => {
        updateWidget("");
        this._searchBar.value = "";
      }
    });
    layout.addWidget(clearButton);

    // Search button
    const searchButton = new ToolbarButton({
      iconClassName: 'wipp-SearchIcon jp-Icon jp-Icon-16',
      // onClick: searchFunction,
      onClick: async () => {
        updateWidget(this._searchBar.value);
      }
    });
    layout.addWidget(searchButton);
  }

  onUpdateRequest() {
    this._searchBar.value = "";
    this._searchBar.placeholder = this._getPlaceholder();
  }

  private _searchBar: HTMLInputElement;
  private _getPlaceholder: () => string;
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

/**
 * Props for the generic table row React component
 */
interface IGenericTableRowComponentProps<T> {
  el: T;
  headers: [keyof T, string][];
  collectionUrl: string;
  injectCode: (id: string) => void;
}
  
/**
 * Props for the table header React component
 */
export interface IGenericTableHeaderComponentProps<T> {
  headers: [keyof T, string][];
  tableSortedKey: keyof T;
  tableSortedDirection: boolean;
  sortFunction: (key: keyof T) => void;
}

type IGenericTableProps<T> = {
  ar: T[];
  tableHeader: [keyof T, string][];
  collectionUrl: string;
  codeInjector: (id: string) => void;
}

type IGenericTableState<T> = {
  tableSortedKey: keyof T;
  tableSortedDirection: boolean;
}

/*
* React Component for table header
*/
export function TableHeaderComponent<T> (props: IGenericTableHeaderComponentProps<T>) {
  const tableHeaders = props.headers.map((value) => {

    return (
        // Column headers are clickable and will sort by that column on click
        <th onClick={evt => {
            props.sortFunction(value[0]);
            evt.stopPropagation();
        }}>
          <span> {value[1]} </span>
          {(value[0]==props.tableSortedKey && props.tableSortedDirection==true) && <span className="wipp-WippSidebar-table-header-sorted-ascending"> </span> }
          {(value[0]==props.tableSortedKey && props.tableSortedDirection==false) && <span className="wipp-WippSidebar-table-header-sorted-descending"> </span> }
        </th>
    )
      
  })
  
  return (
    <tr> 
      {tableHeaders}
      {/* Extra column for import buttons with an empty header */}
      <th className="wipp-WippSidebar-table-header-import-column"></th> 
    </tr>
  );
}
  
/**
 * React Component for table row containing single imageCollection
 */
export function TableRowComponent(props: IGenericTableRowComponentProps<IGenericCollection>) {
  const {el, headers, collectionUrl, injectCode} = props;

  // function to convert imagecollection size to human-readable format
  const sizeof = (bytes: number) => {
    if (bytes == 0) { return "0.00 B"; }
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes/Math.pow(1024, e)).toFixed(0)+' '+' KMGTP'.charAt(e)+'B';
  }

  // Convert creation timestamp to human-readable format
  var date = new Date(el.creationDate);

  var allElsTemplates = {
    name: <td> <a href={collectionUrl + el.id} target="_blank"> {el.name} </a> </td>, //name of collection
    numberOfImages: <td className="wipp-WippSidebar-table-element"> {el.numberOfImages} </td>,
    imagesTotalSize: <td className="wipp-WippSidebar-table-element"> {sizeof(el.imagesTotalSize)} </td>,
    creationDate: <td className="wipp-WippSidebar-table-element"> {date.toLocaleString()} </td>, // Date of collection creation
  }
  
  var els = headers.map((value) =>  {
    if (value[0]=='name') return allElsTemplates.name;
    if (value[0]=='numberOfImages') return allElsTemplates.numberOfImages;
    if (value[0]=='imagesTotalSize') return allElsTemplates.imagesTotalSize;
    if (value[0]=='creationDate') return allElsTemplates.creationDate;
  } );
    
  
  // return tr element
  return (
    <tr>
      {els}
      {/* Import button column element */}
      <td>
        <button 
          type="button"
          className="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button"
          onClick={evt => {
            injectCode(el.id);
            evt.stopPropagation();
          }}>
            <span className="wipp-ImportIcon jp-Icon jp-Icon-16"></span>
          </button>
      </td>
      
    </tr>
  )
}
  
  
// Generic class for different types of tables (ImageCollection, CsvCollection, etc)
export class GenericTableWidget<T> extends Component<IGenericTableProps<IGenericCollection>, IGenericTableState<IGenericCollection>> {
  constructor(props: IGenericTableProps<IGenericCollection>){
    super(props);

    this.state = {
      tableSortedKey: 'creationDate', 
      tableSortedDirection: true
    };
  }

  // Apply sort to WIPP Collections Array
  // Update the React State
  sort(key: keyof IGenericCollection) {
    var ar = this.props.ar;
    var direction = this.state.tableSortedDirection;
    
    if (key == this.state.tableSortedKey){
      direction = !direction;
    }

    ar.sort(function(a, b){
      var x = a[key]; var y = b[key];
      if (direction===true) {
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      }
      else if (direction===false) {
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      }
    });

    this.setState({tableSortedDirection: direction, tableSortedKey: key});
  }

  render() {
    // Generate headers and rows of the table
    const tableHeaders = <TableHeaderComponent headers={this.props.tableHeader} tableSortedKey={this.state.tableSortedKey} tableSortedDirection={this.state.tableSortedDirection} sortFunction={key => this.sort(key)} />;
    const tableRows = this.props.ar.map((e) => <TableRowComponent key={e.id} el={e} headers={this.props.tableHeader} collectionUrl={this.props.collectionUrl} injectCode={this.props.codeInjector} />);
    
    
    // Assemble headers and rows in the full table
    return (
      <div>
        <table className='wipp-WippSidebar-table'>
          <thead>
            {tableHeaders}
          </thead>
          <tbody>
            {tableRows}
          </tbody>
        </table>
      </div>
    );
  }
};