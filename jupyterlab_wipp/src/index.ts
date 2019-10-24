import { JupyterFrontEnd, JupyterFrontEndPlugin, ILabShell } from '@jupyterlab/application';
import { ICommandPalette, showDialog, Dialog } from '@jupyterlab/apputils'
import { IMainMenu } from '@jupyterlab/mainmenu'
import { INotebookTracker } from '@jupyterlab/notebook'
import { IConsoleTracker } from '@jupyterlab/console';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
// import { Widget } from '@phosphor/widgets';
import { WippSidebar } from './sidebar';

import { NotebookInfoForm } from './notebookInfoBox';
import { WippRegister } from './wippRegister';
// import { wippTabStyle } from './componentsStyle/WippStyle';


export interface INotebookInfo {
  name: string;
  description: string;
  openInWipp: boolean;
}

/**
 * Activation function for the jupyterlab_wipp extension.
 */
function activate(
  app: JupyterFrontEnd,
  palette: ICommandPalette,
  mainMenu: IMainMenu,
  notebookTracker: INotebookTracker,
  factory: IFileBrowserFactory,
  labShell: ILabShell,
  consoleTracker: IConsoleTracker,
): void {
  console.log('JupyterLab extension jupyterlab_wipp is activated!');

  // Show dialogs and register notebooks
  function registerByPath(path: string): void {
    // Launch dialog form to collect notebook name and description
    showDialog(
      {
        title: 'Register Notebook in WIPP',
        body: new NotebookInfoForm()
      }
    ).then(
      result => {
        if (!result.button.accept) {
          console.log('Notebook registering cancelled by user.');
          return;
        }
        const info = result.value;
        console.log(`Form accepted. Name: ${info.name}. Description: ${info.description}`);

        // Launch WippRegister dialog
        showDialog({
          title: 'Waiting for WIPP...',
          body: new WippRegister(path, info.name, info.description, info.openInWipp),
          buttons: [Dialog.okButton({ label: 'DISMISS' })]
        })
      }
    )
  }

  //Create command for context menu
  const registerContextMenuCommandID = 'wipp-register-context-menu';
  app.commands.addCommand(registerContextMenuCommandID, {
    label: 'Register in WIPP',
    iconClass: 'jp-MaterialIcon jp-LinkIcon',
    isVisible: () => factory.tracker.currentWidget.selectedItems().next().type === 'notebook',
    execute: () => registerByPath(factory.tracker.currentWidget.selectedItems().next().path)
  });

  // Add command to context menu
  const selectorItem = '.jp-DirListing-item[data-isdir]';
  app.contextMenu.addItem({
    command: registerContextMenuCommandID,
    selector: selectorItem
  })

  //Create command for main menu
  const registerFileMenuCommandID = 'wipp-register-menu';
  app.commands.addCommand(registerFileMenuCommandID, {
    label: 'Register in WIPP',
    iconClass: 'jp-MaterialIcon jp-LinkIcon',
    isVisible: () => notebookTracker.currentWidget !== null && notebookTracker.currentWidget === app.shell.currentWidget, // Check if notebook is open to enable menu command
    execute: () => registerByPath(notebookTracker.currentWidget.context.path)
  });

  // Add command to the main menu
  mainMenu.fileMenu.addGroup([
    {
      command: registerFileMenuCommandID,
    }
  ], 40 /* rank */);

  // Add command to the palette
  palette.addItem({
    command: registerFileMenuCommandID,
    category: 'WIPP',
    args: {}
  });

  // Create the WIPP sidebar panel
  const sidebar = new WippSidebar(app, notebookTracker, consoleTracker);
  sidebar.id = 'wipp-labextension:plugin';
  sidebar.title.iconClass = 'wipp-WippLogo jp-SideBar-tabIcon';
  sidebar.title.caption = 'WIPP';

  // Register sidebar panel with JupyterLab
  labShell.add(sidebar, 'left', { rank: 200 });
}

/**
 * Initialization data for the jupyterlab_wipp extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_wipp',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu, INotebookTracker, IFileBrowserFactory, ILabShell],
  activate: activate
};

export default extension;