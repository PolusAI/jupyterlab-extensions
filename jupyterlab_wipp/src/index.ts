import { JupyterFrontEnd, JupyterFrontEndPlugin, ILabShell } from '@jupyterlab/application';
import { ICommandPalette, showDialog, Dialog } from '@jupyterlab/apputils'
import { IMainMenu } from '@jupyterlab/mainmenu'
import { INotebookTracker } from '@jupyterlab/notebook'
import { IConsoleTracker } from '@jupyterlab/console';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
// import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { requestAPI } from './handler';
import { NotebookInfoForm } from './notebookInfoBox';
import { WippRegister } from './wippRegister';
import { WippSidebar } from './sidebar';

export interface INotebookInfo {
  name: string;
  description: string;
  openInWipp: boolean;
}

/**
 * Initialization data for the jupyterlab_wipp extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_wipp:plugin',
  autoStart: true,
  requires: [ICommandPalette, IMainMenu, INotebookTracker, IFileBrowserFactory, ILabShell, IConsoleTracker],
  // optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd, 
    palette: ICommandPalette,
    // settingRegistry: ISettingRegistry | null,
    mainMenu: IMainMenu,
    notebookTracker: INotebookTracker,
    factory: IFileBrowserFactory,
    labShell: ILabShell,
    consoleTracker: IConsoleTracker
  ) => {
    console.log('JupyterLab extension jupyterlab_wipp is activated!');

    // if (settingRegistry) {
    //   settingRegistry
    //     .load(plugin.id)
    //     .then(settings => {
    //       console.log('jupyterlab_wipp settings loaded:', settings.composite);
    //     })
    //     .catch(reason => {
    //       console.error('Failed to load settings for jupyterlab_wipp.', reason);
    //     });
    // }

    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jupyterlab_wipp server extension appears to be missing.\n${reason}`
        );
      });
    
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
          const info = result.value!;
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

    // Create command for context menu
    const registerContextMenuCommandID = 'wipp-register-context-menu';
    app.commands.addCommand(registerContextMenuCommandID, {
      label: 'Register in WIPP',
      iconClass: 'jp-MaterialIcon jp-LinkIcon',
      isVisible: () => true,
      // isVisible: () => factory.tracker.currentWidget!.selectedItems().next()!.type === 'notebook',
      execute: () => registerByPath(factory.tracker.currentWidget!.selectedItems().next()!.path)
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
      execute: () => registerByPath(notebookTracker.currentWidget!.context.path)
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
};

export default plugin;
