import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from '@jupyterlab/application';
import { IDocumentManager } from '@jupyterlab/docmanager';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { IStateDB } from '@jupyterlab/statedb';
import { LabIcon } from '@jupyterlab/ui-components';
import { ExtensionConstants, addFilePathToDB } from './extensionConstants';
import { CreatorSidebar } from './sidebar';
import logoSvg from '../style/logo.svg';

const logoIcon = new LabIcon({
  name: 'wipp-plugin-builder:logo',
  svgstr: logoSvg
});

const filepaths: string[] = [];

const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_wipp_plugin_creator:plugin',
  autoStart: true,
  requires: [IFileBrowserFactory, ILabShell, IStateDB, IDocumentManager],
  activate: (
    app: JupyterFrontEnd,
    factory: IFileBrowserFactory,
    labShell: ILabShell,
    state: IStateDB,
    manager: IDocumentManager
  ) => {
    // Initialzie dbkey if not in IStateDB
    state.list().then(response => {
      const keys = response.ids as string[];
      if (keys.indexOf(ExtensionConstants.dbkey) === -1) {
        state.save(ExtensionConstants.dbkey, filepaths);
      }
    });

    // Create the WIPP sidebar panel
    const sidebar = new CreatorSidebar(state, manager);
    sidebar.id = 'wipp-labextension:plugin';
    sidebar.title.icon = logoIcon;
    sidebar.title.caption = 'WIPP Plugin Creator';
    labShell.add(sidebar, 'left', { rank: 200 });

    // Add context menu command, right click file browser to register marked files to be converted to plugin
    let filepath = '';
    const addFileToPluginContextMenuCommandID =
      'wipp-plugin-creator-add-context-menu';
    app.commands.addCommand(addFileToPluginContextMenuCommandID, {
      label: 'Add to the new WIPP plugin',
      iconClass: 'jp-MaterialIcon jp-AddIcon',
      isVisible: () =>
        ['notebook', 'file'].includes(
          factory.tracker.currentWidget.selectedItems().next().type
        ),
      execute: () => {
        filepath = factory.tracker.currentWidget.selectedItems().next().path;
        addFilePathToDB(state, filepath);
      }
    });

    // Add command to context menu
    const selectorItem = '.jp-DirListing-item[data-isdir]';
    app.contextMenu.addItem({
      command: addFileToPluginContextMenuCommandID,
      selector: selectorItem
    });
  }
};

export default plugin;
