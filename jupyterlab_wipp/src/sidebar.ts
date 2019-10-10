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
    constructor() {
        super();
        this.addClass('wipp-WippSidebar');
        let layout = (this.layout = new PanelLayout());
        //layout.addWidget(this._dashboard);

        // Make request to the backend API
        const settings = ServerConnection.makeSettings();
        const requestUrl = URLExt.join(settings.baseUrl, '/wipp/imageCollections');

        ApiRequest<IWippImageCollection[]>(requestUrl, {}, settings)
        .then((objectArray) => {
            let fieldTitles: string[] = ['Name', 'ID', '# of images', 'Total size'];

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

                tbdy.appendChild(tr);    
            });

            this._table.appendChild(tbdy);
            wrapper.node.appendChild(this._table);
            layout.addWidget(wrapper);

        })
    }

    private _table: HTMLTableElement;
}