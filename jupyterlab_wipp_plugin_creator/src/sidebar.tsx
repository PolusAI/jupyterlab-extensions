import { Widget, PanelLayout } from '@lumino/widgets';
import { SchemaForm } from '@deathbeds/jupyterlab-rjsf';
import { IStateDB } from '@jupyterlab/statedb';
import { AddedFilesWidget } from './addedFilesWidget';
import { requestAPI } from './handler';
import schemaForm from "./WippPluginSchema.json";

export class CreatorSidebar extends Widget {
  /**
   * Create a new WIPP plugin creator sidebar.
   */
  constructor(
    state: IStateDB
  ) {
    super();
    this.addClass('wipp-pluginCreatorSidebar');

    // Define Widget layout
    let layout = (this.layout = new PanelLayout());

    let title = new Widget();
    let h1 = document.createElement('h1');
    h1.innerText = "Create New Plugin";
    title.node.appendChild(h1);
    layout.addWidget(title);

    //necessary or plugin will not activate
    const schema = schemaForm

    this._addFileWidget = new AddedFilesWidget(state)
    layout.addWidget(this._addFileWidget);

    const formData: any = {
      name: "My Plugin",
      version: "0.1.0",
      requirements: [''],
      inputs: [{}],
      outputs: [{}],
    };

    this._form = new SchemaForm(schema, { formData: formData });
    layout.addWidget(this._form);

    const runButtonWidget = new Widget()

    const runButton = document.createElement('button');
    runButton.className = 'run';
    runButton.onclick = () => {
      this.submit()
    }
    runButton.innerText = "Create Plugin"
    runButtonWidget.node.appendChild(runButton)
    layout.addWidget(runButtonWidget)
  }

  //Sidebar constructor ends
  submit() {

    //Create API request on submit
    let formValue = this._form.getValue()
    let request = {
      formdata: formValue.formData,
      addedfilepaths: this._addFileWidget.getValue()
    };

    if (formValue.errors !== null) {

      var fullRequest = {
        method: 'POST',
        body: JSON.stringify(request)
      };
      
      requestAPI<any>('createplugin', fullRequest)
        .then(response => {
          console.log('POST request sent.')
        })
        .catch(() => console.log('There is an error making POST CreatePlugin API request.'));
    }

    else {
      console.log(`Schema form data returns with an error`);
      console.log(formValue.errors)
    }

  }

  private _addFileWidget: AddedFilesWidget;
  private _form: SchemaForm;
}