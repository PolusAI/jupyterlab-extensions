import { JupyterFrontEnd, JupyterFrontEndPlugin, ILabShell } from '@jupyterlab/application';
import { IMainMenu } from '@jupyterlab/mainmenu'
import { INotebookTracker } from '@jupyterlab/notebook'
import { IConsoleTracker } from '@jupyterlab/console';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { Creator_Sidebar } from './sidebar';
import { IStateDB } from '@jupyterlab/statedb'
import { ExtensionConstants } from './extensionConstants';


let filepaths: string[] = [];
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_wipp_plugin_creator:plugin',
  autoStart: true,
  requires: [IMainMenu, INotebookTracker, IFileBrowserFactory, ILabShell, IConsoleTracker, IStateDB],
  activate: (
    app: JupyterFrontEnd,
    mainMenu: IMainMenu,
    notebookTracker: INotebookTracker,
    factory: IFileBrowserFactory,
    labShell: ILabShell,
    consoleTracker: IConsoleTracker,
    state: IStateDB
  ) => {

    // Initialzie dbkey if not in IStateDB
    state.list().then(response => {
      let keys = response.ids as String[];
      if (keys.indexOf(ExtensionConstants.dbkey) === -1) {
        state.save(ExtensionConstants.dbkey, filepaths)
      }
    })

    // Add context menu command, right click file browser to register mark files to be converted to plugin
    var filepath = ''
    const addFileToPluginContextMenuCommandID = 'wipp-plugin-creator-add-context-menu';
    app.commands.addCommand(addFileToPluginContextMenuCommandID, {
      label: 'Add to the new WIPP plugin',
      iconClass: 'jp-MaterialIcon jp-AddIcon',
      isVisible: () => ['notebook', 'file'].includes(factory.tracker.currentWidget!.selectedItems().next()!.type),
      execute: () => {
        filepath = factory.tracker.currentWidget!.selectedItems().next()!.path;
        state.fetch(ExtensionConstants.dbkey).then(response => {
          filepaths = response as string[];
          if (filepaths.indexOf(filepath) === -1) {
            filepaths.push(filepath);
          }
          else {
            console.log(`${filepath} was already added`)
          }
          state.save(ExtensionConstants.dbkey, filepaths);
        })
      }
    })
    state.list().then(response => { console.log(response) })

    // Create the WIPP sidebar panel
    const sidebar = new Creator_Sidebar(app, notebookTracker, consoleTracker, state);
    sidebar.id = 'wipp-labextension:plugin';
    sidebar.title.iconClass = 'wipp-pluginCreatorLogo jp-SideBar-tabIcon';
    sidebar.title.caption = 'WIPP Plugin Creator';
    labShell.add(sidebar, 'left', { rank: 200 });


    // Add command to context menu
    const selectorItem = '.jp-DirListing-item[data-isdir]';
    app.contextMenu.addItem({
      command: addFileToPluginContextMenuCommandID,
      selector: selectorItem
    })
  }
};

export default plugin;
