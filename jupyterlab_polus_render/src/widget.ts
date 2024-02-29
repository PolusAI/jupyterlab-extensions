import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';
import { PageConfig } from '@jupyterlab/coreutils';
import { store } from '@labshare/polus-render';


// Import the CSS
import '../css/widget.css';

// Get the base URL of the JupyterLab session
const baseUrl = PageConfig.getBaseUrl();
// URL for serving images
const renderFilePrefix = 'jupyterlab-polus-render/image'

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
    let imagePath = this.model.get('imagePath');
    let full_image_path = this.model.get('full_image_path');
    let overlayPath = this.model.get('overlayPath');
    let full_overlay_path = this.model.get('full_overlay_path');
    let imageUrl = '';
    let overlayUrl = '';

    // URL was provided
    if (imagePath.startsWith('http')) {
      imageUrl = `${full_image_path}`;
    // Local file was provided
    } else {
      if (imagePath !== '') {
        imageUrl = `${baseUrl}${renderFilePrefix}${full_image_path}`;
      }
    }

    // URL was provided
    if (overlayPath.startsWith('http')) {
      overlayUrl = `${full_overlay_path}`;
    // Local file was provided
    } else {
      if (overlayPath !== '') {
        overlayUrl = `${baseUrl}${renderFilePrefix}${full_overlay_path}`
      }
    }

    console.log('imageUrl', imageUrl);
    console.log('overlayUrl', overlayUrl);

    // Set the image url
    store.setState({
      urls: [
        imageUrl,
      ],
    });

    // Set the overlay url
    fetch(overlayUrl).then((response) => {
      response.json().then((overlayData) => {
        store.setState({
          overlayData,
        });
        const heatmapIds = Object.keys(overlayData.value_range)
          .map((d: any) => ({ label: d, value: d }))
          .concat({ label: 'None', value: null });
    
        store.setState({
          heatmapIds,
        });
      });
    });    

    this.el.innerHTML = `
    <div style="width:100%;height:900px">
    <div style="position: absolute; z-index: 100; right: 0">
              <image-menu-web-component></image-menu-web-component>
              <overlay-menu-web-component></overlay-menu-web-component>
            </div>
            <viv-viewer-web-component-wrapper></viv-viewer-web-component-wrapper>
            </div>
    `;
  }
}
