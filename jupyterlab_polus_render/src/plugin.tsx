import { Application } from '@lumino/application';
import { DOMWidgetView } from '@jupyter-widgets/base';
import { Widget } from '@lumino/widgets';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { PageConfig } from '@jupyterlab/coreutils';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { store } from '@labshare/polus-render';
import { RenderModel } from './widget';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { Drag } from '@lumino/dragdrop';

const EXTENSION_ID = 'jupyterlab_polus_render:plugin';

// Get the base URL of the JupyterLab session
const baseUrl = PageConfig.getBaseUrl();
// URL for serving images
const renderFilePrefix = 'jupyterlab-polus-render/image';

/**
 * The render plugin.
 */
const renderPlugin: JupyterFrontEndPlugin<void> = {
  id: EXTENSION_ID,
  requires: [
    IJupyterWidgetRegistry,
    IFileBrowserFactory
  ],
  activate: activateWidgetExtension,
  autoStart: true,
};

export default renderPlugin;

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  app: Application<Widget>,
  registry: IJupyterWidgetRegistry,
  browserFactory: IFileBrowserFactory
): void { 
  const RenderView = class extends DOMWidgetView {
    loadsetState() {
      let imagePath = this.model.get('imagePath');
      let overlayPath = this.model.get('overlayPath');
      let isImagePathUrl = this.model.get('is_imagePath_url');
      let isOverlayPathUrl = this.model.get('is_overlayPath_url');
      let imageUrl = isImagePathUrl ? imagePath : `${baseUrl}${renderFilePrefix}${imagePath}`; // T/F condition ? valueIfTrue : valueIfFalse
      let overlayUrl = isOverlayPathUrl ? overlayPath : `${baseUrl}${renderFilePrefix}${overlayPath}`;
      
      // Updates the state based on current value
      this.model.set('is_imagePath_url', imagePath.startsWith('http')); 
      this.model.set('isOverlayPathUrl', overlayPath.startsWith('http')); 
      this.model.save_changes();


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
    }

    render() {
      this.loadsetState();

      // Observe any changes to imagePath and rerun the widget when it changes
      this.model.on('change:imagePath', () => {
        this.loadsetState(); // Updates the value of imagePath
        this.render(); // Re-render widgets view with new state
      }, this);

      // Observe any changes to overlayPath and rerun the widget when it changes
      this.model.on('change:overlayPath', () => {
        this.loadsetState(); // Updates the value of overlayPath
        this.render(); // Re-render widgets view with new state
      }, this);

      const { tracker } = browserFactory;

      // Handle drop event
      const handleDrop = async (e: Event): Promise<void> => {
        const dragEvent = e as Drag.Event;
        dragEvent.preventDefault();
        
        // Log the dropped item's data
        console.log("Item dropped:", e);
        const widget = tracker.currentWidget;
        if (!widget) {
          return;
        }
        const selectedItem = widget.selectedItems().next().value;
        if (!selectedItem) {
          return;
        }
        const relativePath = encodeURI(selectedItem.path);

        let notebook_absdir = this.model.get('notebook_absdir'); // Fetch from render.py

        // An overlay gets dropped on an image
        if (relativePath.endsWith('.json')){
          if (filePath) {
            filePath.innerHTML = `Path: ${relativePath}`;
          }
          this.model.set('overlayPath', notebook_absdir + '/../' + relativePath);
          this.model.set('is_overlayPath_url', false);
          this.model.save_changes();

          this.loadsetState(); 
        }
        // An image gets dropped
        else {
          if (filePath) {
            filePath.innerHTML = `Path: ${relativePath}`; 
          }
          this.model.set('imagePath', notebook_absdir + '/../' + relativePath);
          this.model.set('is_imagePath_url', false);
          this.model.save_changes();

          this.loadsetState();
        }
      };

      // Create the container element
      // const dropzoneContainer = document.createElement('div');
      const filePath = document.createElement('div');
      filePath.id = 'filePath';
      const dropzone = document.createElement('div');
      dropzone.id = 'dropzoneContainer';
      const polusRender = document.createElement('polus-render');

      this.el.appendChild(filePath);
      this.el.appendChild(dropzone);
      dropzone.appendChild(polusRender);
      

      // Attach drag and drop event listeners
      dropzone.addEventListener('dragenter', (event) => event.preventDefault());
      dropzone.addEventListener('dragover', (event) => event.preventDefault());
      dropzone.addEventListener('dragleave', (event) => event.preventDefault());
      dropzone.addEventListener('drop', handleDrop);
    }
  } 

  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: {
      RenderModel,
      RenderView
    },
  });
}
