import { JupyterFrontEnd, JupyterFrontEndPlugin, ILabShell } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IStateDB } from '@jupyterlab/statedb'
import { LabIcon } from '@jupyterlab/ui-components';
import { ExtensionConstants } from './extensionConstants';
import { CreatorSidebar } from './sidebar';
import logoSvg from '../style/logo.svg';

const logoIcon = new LabIcon({
  name: 'wipp-plugin-builder:logo',
  svgstr: logoSvg
});

let filepaths: string[] = [];

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_wipp_plugin_creator:plugin',
  autoStart: true,
  requires: [IFileBrowserFactory, ILabShell, IStateDB],
  activate: (
    app: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    labShell: ILabShell,
    state: IStateDB
  ) => {

    // Initialzie dbkey if not in IStateDB
    state.list().then(response => {
      let keys = response.ids as String[];
      if (keys.indexOf(ExtensionConstants.dbkey) === -1) {
        state.save(ExtensionConstants.dbkey, filepaths)
      }
    })

    // Create the WIPP sidebar panel
    const sidebar = new CreatorSidebar(state);
    sidebar.id = 'wipp-labextension:plugin';
    sidebar.title.icon = logoIcon;
    sidebar.title.caption = 'WIPP Plugin Creator';
    labShell.add(sidebar, 'left', { rank: 200 });

    // Add context menu command, right click file browser to register marked files to be converted to plugin
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

    // Add command to context menu
    const selectorItem = '.jp-DirListing-item[data-isdir]';
    app.contextMenu.addItem({
      command: addFileToPluginContextMenuCommandID,
      selector: selectorItem
    })
  }
};

export default plugin;
