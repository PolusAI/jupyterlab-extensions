// Copyright (c) as
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import { PageConfig } from '@jupyterlab/coreutils';


// Import the CSS
import '../css/widget.css';

// Get the base URL of the JupyterLab session
const baseUrl = PageConfig.getBaseUrl();
// url for server-ext file
const serverExtensionPath = 'static/render/render-ui/index.html';

export class ExampleModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: ExampleModel.model_name,
      _model_module: ExampleModel.model_module,
      _model_module_version: ExampleModel.model_module_version,
      _view_name: ExampleModel.view_name,
      _view_module: ExampleModel.view_module,
      _view_module_version: ExampleModel.view_module_version,
      imageUrl: `${baseUrl}`,
      iframeSrc: `${baseUrl}${serverExtensionPath}` 
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'ExampleModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'ExampleView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class ExampleView extends DOMWidgetView {
  render() {
    // Get the value of the iframeSrc attribute from the model
    const iframeSrc = this.model.get('iframeSrc');
    let imageUrl = this.model.get('imageUrl');

    let fullSrc = iframeSrc;

    // Check if imageUrl is not empty and concatenate baseUrl
    if (imageUrl !== '') {
      imageUrl = `${baseUrl}${imageUrl}`;
      fullSrc = `${iframeSrc}?imageUrl=${imageUrl}`;
    }

    // Create an iframe element
    const iframe = document.createElement('iframe');
    iframe.src = fullSrc;
    iframe.width = '100%';  
    iframe.style.height = '900px';  // Adjust the height as needed
    
  // Append the iframe to the widget's DOM element
    this.el.appendChild(iframe);
  }
}
