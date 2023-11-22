import { Widget, PanelLayout } from '@lumino/widgets';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { FileDialog } from '@jupyterlab/filebrowser';
import { showDialog, Dialog } from '@jupyterlab/apputils';
import { SchemaForm } from '@polusai/jupyterlab-rjsf';
import { IStateDB } from '@jupyterlab/statedb';
import { AddedFilesWidget } from './addedFilesWidget';
import { requestAPI } from './handler';
import { addFilePathToDB } from './extensionConstants';
import schemaForm from './WippPluginSchema.json';

export class CreatorSidebar extends Widget {
  /**
   * Create a new WIPP plugin creator sidebar.
   */
  constructor(state: IStateDB, manager: IDocumentManager) {
    super();
    this.addClass('wipp-pluginCreatorSidebar');

    // Define Widget layout
    const layout = (this.layout = new PanelLayout());

    const title = new Widget();
    const h1 = document.createElement('h1');
    h1.innerText = 'Create New Plugin';
    title.node.appendChild(h1);
    layout.addWidget(title);

    // Necessary or plugin will not activate
    const schema = schemaForm;

    // Create file manager button
    const chooseFilesButtonWidget = new Widget();
    const chooseFilesButton = document.createElement('button');
    chooseFilesButton.className = 'run';
    chooseFilesButton.onclick = async () => {
      const dialog = FileDialog.getOpenFiles({
        manager // IDocumentManager
      });
      const result = await dialog;
      if (result.button.accept) {
        const files = result.value;
        let filepath: string;
        if (files) {
          for (let i = 0; i < files.length; i++) {
            // files is a list of json,
            // e.g. files[0]: Object { name: "pyproject.toml", path: "pyproject.toml" ..}
            filepath = files[i]['path'];
            addFilePathToDB(state, filepath);
          }
        }
        // log files object on 'Select' of the file manager
        console.log(files);
      }
    };
    chooseFilesButton.innerText = 'Choose Files';
    chooseFilesButtonWidget.node.appendChild(chooseFilesButton);
    layout.addWidget(chooseFilesButtonWidget);

    this._addFileWidget = new AddedFilesWidget(state);
    layout.addWidget(this._addFileWidget);

    const formData: any = {
      name: 'My Plugin',
      title: 'My Plugin',
      version: '0.1.0',
      description: '',
      author: '',
      institution: '',
      repository: '',
      website: '',
      citation: '',
      requirements: [''],
      inputs: [{}],
      outputs: [{}],
      baseImage: ''
    };

    const uiSchema: any = {
      name: {
        'ui:help': 'Hint: Enter human-readable name'
      },
      title: {
        'ui:help': 'Hint: Enter machine-readable name'
      },
      requirements: {
        'ui:help': `Hint: Enter 3rd party python packages that the plugin requires. Just the package name is fine for its latest version. To specify version: \r
          SomeProject == 1.3 \r
          SomeProject >=1.2,<2.0 \r
          SomeProject~=1.4.2 (~= means compatible, >=1.4.2, ==1.4.X)`
      },
      baseImage: {
        'ui:help':
          'Hint: Choose the base image of the WIPP plugin to be created. Leave it as Python if unsure.'
      }
    };

    this._form = new SchemaForm(schema, {
      formData: formData,
      uiSchema: uiSchema,
      onSubmit: (e: any) => this.submit()
    });
    layout.addWidget(this._form);
  }

  //Sidebar constructor ends
  submit(): void {
    //Create API request on submit
    const formValue = this._form.getValue();
    const request = {
      formdata: formValue.formData,
      addedfilepaths: this._addFileWidget.getValue()
    };

    if (formValue.errors !== null) {
      const fullRequest = {
        method: 'POST',
        body: JSON.stringify(request)
      };

      requestAPI<any>('createplugin', fullRequest)
        .then(response => {
          console.log('POST request sent.');
          showDialog({
            body: 'Create Plugin request submitted. Building the plugin...',
            buttons: [Dialog.okButton()]
          });
        })
        .catch(() => {
          console.log(
            'There is an error making POST CreatePlugin API request.'
          );
          showDialog({
            body: 'There is an error making POST CreatePlugin API request.',
            buttons: [Dialog.okButton()]
          });
        });
    } else {
      showDialog({
        body: 'There is an error with form value. Plugin build request failed.',
        buttons: [Dialog.okButton()]
      });
      console.log('Schema form data returns with an error');
      console.log(formValue.errors);
    }
  }

  private _addFileWidget: AddedFilesWidget;
  private _form: SchemaForm;
}
