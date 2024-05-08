import { Application } from '@lumino/application';
import { DOMWidgetView } from '@jupyter-widgets/base';
import { Widget } from '@lumino/widgets';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { RenderModel } from './widget';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { Drag } from '@lumino/dragdrop';
// import { PageConfig } from '@jupyterlab/coreutils';
// import { store } from '@labshare/polus-render';

const EXTENSION_ID = 'jupyterlab_polus_render:plugin';

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

    /**
     * Handle the lm-dragenter event for the widget.
     */
    protected handleDragEnter(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      console.log("Drag enter event:", event);
    }

    /**
     * Handle the lm-dragleave event for the widget.
     */
    protected handleDragLeave(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      console.log("Drag leave event:", event);
    }

    /**
     * Handle the lm-dragover event for the widget.
     */
    protected handleDragOver(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      console.log("Drag over event:", event);
    }

    /**
     * Handle the lm-drop event for the widget.
     */
    protected handleDrop(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
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
      console.log(relativePath);
    }

    protected handleEvent(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
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

    render() {
      const dropzone = document.createElement('div');
      dropzone.id = 'dropzoneContainer';
      const containerStyle = 'width: 100%; height: 900px;'; 
      dropzone.setAttribute('style', containerStyle);  

      this.el.appendChild(dropzone);

      dropzone.addEventListener('lm-dragenter', (event) => this.handleEvent(event as Drag.Event));
      dropzone.addEventListener('lm-dragover', (event) => this.handleEvent(event as Drag.Event));
      dropzone.addEventListener('lm-dragleave', (event) => this.handleEvent(event as Drag.Event));
      dropzone.addEventListener('lm-drop', (event) => this.handleEvent(event as Drag.Event));
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
