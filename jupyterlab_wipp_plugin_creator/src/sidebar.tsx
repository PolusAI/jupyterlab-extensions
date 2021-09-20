import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook'
import { IConsoleTracker } from '@jupyterlab/console';
import { Widget, PanelLayout } from '@lumino/widgets';
import { SchemaForm } from '@deathbeds/jupyterlab-rjsf';
import { ToolbarButton } from '@jupyterlab/apputils';
import { runIcon } from '@jupyterlab/ui-components';
import { AddedFileWidget } from './addedFilesWidget'
import { IStateDB } from '@jupyterlab/statedb'
import { requestAPI } from './handler';

export class Creator_Sidebar extends Widget {
  /**
   * Create a new WIPP plugin creator sidebar.
   */
  constructor(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    consoleTracker: IConsoleTracker,
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

    const schema = {
      title: "Plugin Info",
      type: "object",
      properties: {
        name: {
          type: "string",
          title: "Name",
          default: ""
        },
        version: {
          type: "string",
          title: "Version",
          default: ""
        },
        requirements: {
          type: "array",
          items: {
            type: "string"
          },
          title: "Requirements"
        },
        inputs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                title: "Name"
              },
              description: {
                type: "string",
                title: "Description"
              },
              inputType: {
                type: "string",
                enum: ["collection", "csvCollection", "notebook", "pyramid", "genericData", "stitchingVector"]
              },
              required: {
                type: "boolean",
                title: "Required"
              }
            }
          },
          title: "Inputs"
        },
        outputs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                title: "Name"
              },
              description: {
                type: "string",
                title: "Description"
              },
              inputType: {
                type: "string",
                enum: ["collection", "csvCollection", "notebook", "pyramid", "genericData", "stitchingVector"]
              },
              required: {
                type: "boolean",
                title: "Required"
              }
            }
          },
          title: "Outputs"
        }
      }
    };

    this._addFileWidget = new AddedFileWidget(state)
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

    const refreshButton = new ToolbarButton({
      icon: runIcon,
      onClick: () => { this.submit() }
    });
    layout.addWidget(refreshButton);
  }

  //Sidebar constructor ends
  submit() {
    console.log('Files: ', this._addFileWidget.getValue())
    console.log('Form: ', this._form.getValue())

    //Create API request on submit
    let formvalue = this._form.getValue()
    let request = {
      formdata: formvalue.formData,
      addedfilepaths: this._addFileWidget.getValue()
    };

    if (formvalue.errors !== null) {

      var fullRequest = {
        method: 'POST',
        body: JSON.stringify(request)
      };
      requestAPI<any>('createplugin', fullRequest)
        .then(response => {
          console.log('Handle json object sent:')
          console.log(response)
        })
        .catch(() => console.log('There is an error making POST CreatePlugin API request.'));
    }

    else { console.log(`Schema form data returns with an error`); console.log(formvalue.errors) }

  }

  private _addFileWidget: AddedFileWidget;
  private _form: SchemaForm;
}