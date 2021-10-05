import { Widget } from '@lumino/widgets';
import { IStateDB } from '@jupyterlab/statedb'
import { Message } from '@lumino/messaging';
import { ExtensionConstants } from './extensionConstants';


export class AddedFilesWidget extends Widget {
    constructor(state: IStateDB) {
        super();
        this._state = state;
        this._addedFileDiv = document.createElement('p');
        this.node.appendChild(this._addedFileDiv);

        let button = document.createElement('button');
        button.innerHTML = 'Update list of files';
        button.onclick = () => this.update();
        this.node.appendChild(button);

        this.update();
    }

    onUpdateRequest(msg: Message): void {
        this._state.fetch(ExtensionConstants.dbkey).then(response => {
            this._addedFileNames = response as string[];
            
            let text = 'Added Files: <br>';
            if (this._addedFileNames) {
                for (let i = 0; i < this._addedFileNames.length; i++) {
                    text += this._addedFileNames[i] + "<br>";
                }
            }
            
            this._addedFileDiv.innerHTML = text;
        });
    }

    public getValue(): string[] {
        return this._addedFileNames;
    }

    private _state: IStateDB;
    private _addedFileNames: string[] = [];
    private _addedFileDiv: HTMLDivElement;
}