import { Dialog } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { INotebookInfo } from './index';

/**
 * The UI for registering notebook in WIPP
 * Form asks user for notebook name and description
 */
export class NotebookInfoForm extends Widget 
  implements Dialog.IBodyWidget<INotebookInfo> {

  constructor() {
    super();
    this.node.appendChild(this.createBody());
  }

  private createBody(): HTMLElement {
    const node = document.createElement('div');
    const text = document.createElement('span');
    this._name = document.createElement('input');
    this._description = document.createElement('input');

    node.className = 'jp-RedirectForm';
    text.textContent = 'Enter notebook name and description';
    this._name.placeholder = 'Notebook name';
    this._description.placeholder = 'Short description';

    this._openInWipp = document.createElement('input');
    this._openInWipp.type = "checkbox"
    this._openInWipp.id = "open-in-wipp"
    this._openInWipp.checked = true;
    this._openInWipp.style.display = 'inline';
    this._openInWipp.style.width = 'fit-content';
    const label = document.createElement('label');
    label.htmlFor = "open-in-wipp";
    label.appendChild(document.createTextNode('Show in WIPP')); 


    node.appendChild(text);
    node.appendChild(this._name);
    node.appendChild(this._description);
    node.appendChild(this._openInWipp);
    node.appendChild(label);
    return node;
  }

  /**
   * Returns the input value.
   */
  getValue(): INotebookInfo {
    let info = {
      name: this._name.value,
      description: this._description.value,
      openInWipp: this._openInWipp.checked
    };
    return info;
  }

  private _name!: HTMLInputElement;
  private _description!: HTMLInputElement;
  private _openInWipp!: HTMLInputElement;
}