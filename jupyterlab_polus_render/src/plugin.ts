import { Application } from '@lumino/application';
import { DOMWidgetView } from '@jupyter-widgets/base';
import { Widget } from '@lumino/widgets';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { RenderModel } from './widget';
import { MODULE_NAME, MODULE_VERSION } from './version';
import { Drag } from '@lumino/dragdrop';
import '../css/dropzone.css';

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
    protected dropzoneElement: HTMLDivElement;

    /**
     * Handle the lm-dragenter event for the widget.
     */
    protected handleDragEnter(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      this.dropzoneElement.classList.add('dragover');
      console.log("Drag enter event:", event);
    }

    /**
     * Handle the lm-dragleave event for the widget.
     */
    protected handleDragLeave(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      this.dropzoneElement.classList.remove('dragover');
      console.log("Drag leave event:", event);
    }

    /**
     * Handle the lm-dragover event for the widget.
     */
    protected handleDragOver(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      event.dropAction = "move";
      console.log("Drag over event:", event);
    }

    /**
     * Handle the lm-drop event for the widget.
     */
    protected handleDrop(event: Drag.Event): void {
      event.preventDefault();
      event.stopPropagation();
      this.dropzoneElement.classList.remove('dragover');
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
      console.log(event.supportedActions);
      // event.preventDefault();
      // event.stopPropagation();
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
      const dropzoneWidget = new Widget();
      this.dropzoneElement = document.createElement('div');
      this.dropzoneElement.textContent = 'Drop files here';
      this.dropzoneElement.className = 'dropzone';

      dropzoneWidget.node.appendChild(this.dropzoneElement);
      this.el.appendChild(dropzoneWidget.node);

      this.dropzoneElement.addEventListener('lm-dragenter', (event) => this.handleEvent(event as Drag.Event));
      this.dropzoneElement.addEventListener('lm-dragover', (event) => this.handleEvent(event as Drag.Event));
      this.dropzoneElement.addEventListener('lm-dragleave', (event) => this.handleEvent(event as Drag.Event));
      this.dropzoneElement.addEventListener('lm-drop', (event) => this.handleEvent(event as Drag.Event));
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
