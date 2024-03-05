// coding: utf-8

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

export class RenderModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: RenderModel.model_name,
      _model_module: RenderModel.model_module,
      _model_module_version: RenderModel.model_module_version,
      _view_name: RenderModel.view_name,
      _view_module: RenderModel.view_module,
      _view_module_version: RenderModel.view_module_version,
      is_imagePath_url: false, // Default 
      is_overlayPath_url: false, // Default
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'RenderModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'RenderView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class RenderView extends DOMWidgetView {
  render() {
    //let imagePath = this.model.get('imagePath');
    let full_image_path = this.model.get('full_image_path');
    //let overlayPath = this.model.get('overlayPath');
    let full_overlay_path = this.model.get('full_overlay_path');
    let isImagePathUrl = this.model.get('is_imagePath_url');
    let isOverlayPathUrl = this.model.get('is_overlayPath_url');
    let imageUrl = isImagePathUrl ? full_image_path : `${baseUrl}${renderFilePrefix}${full_image_path}`; // T/F condition ? valueIfTrue : valueIfFalse
    let overlayUrl = isOverlayPathUrl ? full_overlay_path : `${baseUrl}${renderFilePrefix}${full_overlay_path}`;

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
