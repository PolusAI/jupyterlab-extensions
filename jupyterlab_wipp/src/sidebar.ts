import { Widget, PanelLayout } from '@phosphor/widgets';
import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

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
    constructor() {
        super();
        this.addClass('wipp-WippSidebar');
        let layout = (this.layout = new PanelLayout());
        //layout.addWidget(this._dashboard);

        const wrapper = new Widget();
        wrapper.addClass('wipp-WippSidebar-table');

        //TODO: create table here
        ///////////
        this._table = document.createElement('table');

        let fieldTitles: string[] = ['Name', 'ID', '# of images', 'Total size'];
        // let fields: string[] = ['id', 'name'];
        let objectArray: { 
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
            metadataFilesTotalSize: number
        }[] = [
            {
                'id': '5d92a358d62b90000918dd52',
                'name': 'test-small',
                'creationDate': '2019-10-01T00:52:40.870+0000',
                'sourceJob': undefined,
                'locked': true,
                'pattern': undefined,
                'numberOfImages': 30,
                'imagesTotalSize': 81981731,
                'numberImportingImages': 0,
                'numberOfImportErrors': 0,
                'numberOfMetadataFiles': 0,
                'metadataFilesTotalSize': 0
            },
            {
                'id': '5d92afe3d62b90000918e12d',
                'name': 'sml-seg-feat-sml-egtseg-output',
                'creationDate': '2019-10-01T01:46:11.684+0000',
                'sourceJob': '5d92af81d62b90000918e12b',
                'locked': true,
                'pattern': undefined,
                'numberOfImages': 30,
                'imagesTotalSize': 503322900,
                'numberImportingImages': 0,
                'numberOfImportErrors': 0,
                'numberOfMetadataFiles': 0,
                'metadataFilesTotalSize': 0
            },
            {
                'id': '5d92b2b2d62b90000918e14d',
                'name': 'test-large',
                'creationDate': '2019-10-01T01:58:10.831+0000',
                'sourceJob': undefined,
                'locked': true,
                'pattern': undefined,
                'numberOfImages': 1105,
                'imagesTotalSize': 3420746698,
                'numberImportingImages': 0,
                'numberOfImportErrors': 0,
                'numberOfMetadataFiles': 0,
                'metadataFilesTotalSize': 0
            }
        ]


        // Make request to the backend API
        const settings = ServerConnection.makeSettings();
        const requestUrl = URLExt.join(settings.baseUrl, '/wipp/imageCollections');

        ApiRequest<any>(requestUrl, {}, settings)
        .then(response => {
            console.log(response);
          })

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

            // fields.forEach((field: string) => {
                // var td = document.createElement('td');
                // console.log(object.id);
                // td.appendChild(document.createTextNode(object[field]));
                // tr.appendChild(td);
            // });
            tbdy.appendChild(tr);    
        });

        this._table.appendChild(tbdy);
        ///////////

        
        //this._input = document.createElement('input');
        //this._input.placeholder = 'DASK DASHBOARD URL';
        wrapper.node.appendChild(this._table);
        layout.addWidget(wrapper);
    }

    private _table: HTMLTableElement;
}