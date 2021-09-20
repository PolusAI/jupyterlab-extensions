import { Widget } from '@lumino/widgets';
import { IStateDB } from '@jupyterlab/statedb'
import { ExtensionConstants } from './extensionConstants';
import {Message} from '@lumino/messaging';
// import { requestAPI } from './handler';

export class AddedFileWidget extends Widget {
    constructor(state: IStateDB) {
        super();
        this._state = state;
        this._addedfilediv = document.createElement('p');
        this.node.appendChild(this._addedfilediv);

        let button = document.createElement('button');
        button.innerHTML = 'Update list of files';
        button.onclick = () => this.update();
        this.node.appendChild(button);

        this.update();
    }

    onUpdateRequest(msg: Message): void {
        this._state.fetch(ExtensionConstants.dbkey).then(response => {
            this._addedfilenames = response as string[];
            
            let text = 'Added Files: <br>';
            if (this._addedfilenames) {
                for (let i = 0; i < this._addedfilenames.length; i++) {
                    text += this._addedfilenames[i] + "<br>";
                }
            }
            
            this._addedfilediv.innerHTML = text;
        });
    }

    public getValue(): string[] {
        return this._addedfilenames;
    }

    private _state: IStateDB;
    private _addedfilenames: string[] = [];
    private _addedfilediv: HTMLDivElement;
}