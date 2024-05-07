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
  
  const tracker = browserFactory.tracker;
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


  /**
   * Handle the `'lm-dragenter'` event for the widget.
   */
    protected evtDragEnter(event: Drag.Event): void {
        event.preventDefault();
        event.stopPropagation();
    }
    

  /**
   * Handle the `'lm-dragleave'` event for the widget.
   */
    protected evtDragLeave(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
    }
    
  
    /**
     * Handle the `'lm-dragover'` event for the widget.
     */
    protected evtDragOver(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
    }

    
    async handleDrop(event: Drag.Event, filePath: HTMLElement): Promise<void> {
      event.preventDefault();
      event.stopPropagation();
      // Log the dropped item's data
      console.log("Item dropped:", event);

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
    }


    handleEvent(event: Drag.Event, filePath: HTMLElement): void {
      event.preventDefault();
      event.stopPropagation();
      switch (event.type) {
        case 'lm-dragenter':
          this.evtDragEnter(event);
          break;
        case 'lm-dragleave':
          this.evtDragLeave(event);
          break;
        case 'lm-dragover':
          this.evtDragOver(event);
          break;
        case 'lm-drop':
          this.handleDrop(event, filePath);
          break;
        default:
          break;
      }
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

      // Handle drop event
      // const handleDrop = async (e: Drag.Event): Promise<void> => {
        
      //   // Log the dropped item's data
      //   console.log("Item dropped:", e);

      //   const widget = tracker.currentWidget;
      //   if (!widget) {
      //     return;
      //   }
      //   const selectedItem = widget.selectedItems().next().value;
      //   if (!selectedItem) {
      //     return;
      //   }
      //   const relativePath = encodeURI(selectedItem.path);

      //   let notebook_absdir = this.model.get('notebook_absdir'); // Fetch from render.py

      //   // An overlay gets dropped on an image
      //   if (relativePath.endsWith('.json')){
      //     if (filePath) {
      //       filePath.innerHTML = `Path: ${relativePath}`;
      //     }
      //     this.model.set('overlayPath', notebook_absdir + '/../' + relativePath);
      //     this.model.set('is_overlayPath_url', false);
      //     this.model.save_changes();

      //     this.loadsetState(); 
      //   }
      //   // An image gets dropped
      //   else {
      //     if (filePath) {
      //       filePath.innerHTML = `Path: ${relativePath}`; 
      //     }
      //     this.model.set('imagePath', notebook_absdir + '/../' + relativePath);
      //     this.model.set('is_imagePath_url', false);
      //     this.model.save_changes();

      //     this.loadsetState();
      //   }
      // };

      // Create the div elements

      const filePath = document.createElement('div');
      filePath.id = 'filePath';
      const dropzone = document.createElement('div');
      dropzone.id = 'dropzoneContainer';
      const containerStyle = 'width: 100%; height: 900px;'; // Specify the style for the container div
      dropzone.setAttribute('style', containerStyle);  
          
      const polusRender = document.createElement('polus-render');
  
      // Append filePath and polusRender to the container dropzone
      dropzone.appendChild(filePath);
      dropzone.appendChild(polusRender);

      // Append the container dropzone to this.el
      this.el.appendChild(dropzone);

      // Attach drag and drop event listeners to dropzone html element
      // casting event to type Drag.Event
      dropzone.addEventListener('lm-dragenter', (event) => this.handleEvent(event as Drag.Event, filePath));
      dropzone.addEventListener('lm-dragover', (event) => this.handleEvent(event as Drag.Event, filePath));
      dropzone.addEventListener('lm-dragleave', (event) => this.handleEvent(event as Drag.Event, filePath));
      dropzone.addEventListener('lm-drop', (event) => this.handleEvent(event as Drag.Event, filePath));
      
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
