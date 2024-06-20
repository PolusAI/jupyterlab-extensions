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
import { Dialog, showDialog } from '@jupyterlab/apputils';
import '../css/polusRender.css';

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

function activateWidgetExtension(
  app: Application<Widget>,
  registry: IJupyterWidgetRegistry,
  browserFactory: IFileBrowserFactory
): void { 
  const tracker = browserFactory.tracker;
  const RenderView = class extends DOMWidgetView {
    protected polusRenderElement: HTMLDivElement;
    protected polusRenderWidget: Widget;
    protected eventListenersInitialized = false;

    loadsetState() {
      console.log("loadsetState called");
      let imagePath = this.model.get('imagePath');
      let overlayPath = this.model.get('overlayPath');
      let isImagePathUrl = this.model.get('is_imagePath_url');
      let isOverlayPathUrl = this.model.get('is_overlayPath_url');
      let imageUrl = isImagePathUrl ? imagePath : `${baseUrl}${renderFilePrefix}${imagePath}`; // T/F condition ? valueIfTrue : valueIfFalse
      let overlayUrl = isOverlayPathUrl ? overlayPath : `${baseUrl}${renderFilePrefix}${overlayPath}`;
      
      // [ Not needed anymore since traitlet sync takes cares ]
      // Updates the state based on current value 
      // this.model.set('is_imagePath_url', imagePath.startsWith('http')); 
      // this.model.set('is_overlayPath_url', overlayPath.startsWith('http')); 
      // this.model.save_changes();

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

    protected showUnsupportedFileTypePopup() {
      showDialog({
        title: 'Unsupported File Type',
        body: `The file format is not supported.`,
        buttons: [Dialog.okButton({ label: 'OK' })]
      });
    }

    /**
     * Handle the lm-dragenter event for the widget.
     */
    protected handleDragEnter(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      // Access CSS class: dragover
      this.polusRenderElement.classList.add('dragover');
      this.polusRenderElement.textContent = 'Drop files here'; // Show text when entering 
    }

    /**
     * Handle the lm-dragleave event for the widget.
     */
    protected handleDragLeave(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      this.polusRenderElement.classList.remove('dragover');
      this.polusRenderElement.textContent = ''; // Hide text when leaving
      this.updateView(); 
    } 

    /**
     * Handle the lm-dragover event for the widget.
     */
    protected handleDragOver(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      /** dropAction is 'move' when an object is moved from it's original location into the target element or zone **/
      event.dropAction = "move";
    }

    /**
     * Handle the lm-drop event for the widget.
     */
    protected handleDrop(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      this.polusRenderElement.classList.remove('dragover');
      this.polusRenderElement.textContent = ''; // Hide text after dropping
      console.log("Item dropped:", event);

      const widget = tracker.currentWidget;
      if (!widget) {
        console.error("No active widget found.");
        return;
      }
      const selectedItem = widget.selectedItems().next().value;
      if (!selectedItem) {
        console.error("No selected item found.");
        return;
      }
      const relativePath = encodeURI(selectedItem.path);
      console.log("Dropped file path:", relativePath);
      
      
      let notebook_absdir = this.model.get('notebook_absdir'); // Fetch from render.py
      console.log("Notebook absolute directory:", notebook_absdir);

      // An overlay gets dropped on an image
      if (relativePath.endsWith('.json')){
        // If the overlay path is the same as the current input (same file gets dropped), force a state change
        if (this.model.get('overlayPath') === notebook_absdir + '/../' + relativePath) {
          this.model.set('overlayPath', '');
          this.model.save_changes();
        }

        this.model.set('overlayPath', notebook_absdir + '/../' + relativePath);
        this.model.set('is_overlayPath_url', false);  
        this.model.save_changes();
        // this.render(); -- No need to run render() here ? this.model.on() should take care of the updated val. 
      }
      // An image gets dropped
      else if (relativePath.endsWith('.tif') || relativePath.endsWith('.tiff') || relativePath.endsWith('.zarr')){
        // If the image path is the same as the current (same file gets dropped), force a state change
        if (this.model.get('imagePath') === notebook_absdir + '/../' + relativePath) {
          this.model.set('imagePath', '');
        }

        this.model.set('imagePath', notebook_absdir + '/../' + relativePath);
        this.model.set('is_imagePath_url', false);
        this.model.save_changes();
        console.log("New image path set:", this.model.get('imagePath'));
        // this.render(); -- No need to run render() here ? this.model.on() should take care of the updated val. 
      }
      else {
        console.error("Unsupported file type dropped:", relativePath);
        this.showUnsupportedFileTypePopup(); // Show the popup
      }

    }

    protected handleEvent(event: Drag.Event): void {
      switch (event.type) {
        case 'lm-dragenter':
          this.handleDragEnter(event);
          break;
        case 'lm-dragleave':
          this.handleDragLeave(event);
          break;
        case 'lm-dragover':
          this.handleDragOver(event);
          break;
        case 'lm-drop':
          this.handleDrop(event);
          break;
        default:
          break;
      }
    }
    
    updateView() {
      // Clear previous content - removes all child elements of this.polusRenderElement
      this.polusRenderElement.innerHTML = '';
  
      const polusRender = document.createElement('polus-render');
      this.polusRenderElement.appendChild(polusRender);
    }


    render() {
      this.loadsetState();

      // Create as lumino widget
      if (!this.polusRenderWidget) {
        this.polusRenderWidget = new Widget();
        this.polusRenderElement = document.createElement('div');
        this.polusRenderElement.className = 'polusRender'; // CSS class
        this.polusRenderWidget.node.appendChild(this.polusRenderElement);
        this.el.appendChild(this.polusRenderWidget.node);
      }
      
      // Update the view
      this.updateView();


      // Do not add event listeners repeatedly if already present. Listeners are added only once
      // [initially flagged as false]
      if (!this.eventListenersInitialized) {
        this.polusRenderElement.addEventListener('lm-dragenter', (event) => this.handleEvent(event as Drag.Event));
        this.polusRenderElement.addEventListener('lm-dragover', (event) => this.handleEvent(event as Drag.Event));
        this.polusRenderElement.addEventListener('lm-dragleave', (event) => this.handleEvent(event as Drag.Event));
        this.polusRenderElement.addEventListener('lm-drop', (event) => this.handleEvent(event as Drag.Event));
        this.eventListenersInitialized = true;
      }

      // Observe any changes to imagePath and rerun the widget when it changes
      this.model.on('change:imagePath', () => {
        
        this.loadsetState(); // Updates the value of imagePath
        this.updateView(); // Re-render widgets view with new state
      }, this);

      // Observe any changes to overlayPath and rerun the widget when it changes
      this.model.on('change:overlayPath', () => {
        this.loadsetState(); // Updates the value of overlayPath
        this.updateView(); // Re-render widgets view with new state
      }, this);
    }
  };

  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: {
      RenderModel,
      RenderView
    },
  });
}
