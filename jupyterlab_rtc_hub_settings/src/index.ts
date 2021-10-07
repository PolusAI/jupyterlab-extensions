import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
  ILabShell
} from '@jupyterlab/application';
import { SharingSettingsSidebar } from './sidebar';

/**
 * Initialization data for the jupyterlab_rtc_hub_settings extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_rtc_hub_settings:plugin',
  autoStart: true,
  requires: [ILabShell],
  activate: (app: JupyterFrontEnd, labShell: ILabShell) => {
    console.log(
      'JupyterLab extension jupyterlab_rtc_hub_settings is activated!'
    );

    // Create the sharing settings sidebar panel
    const sidebar = new SharingSettingsSidebar();
    sidebar.id = 'rtc-hub-settings-labextension:plugin';
    sidebar.title.iconClass =
      'rtc-hub-settings-SharingSettingsLogo jp-SideBar-tabIcon';
    sidebar.title.caption = 'Sharing settings';

    // Register sidebar panel with JupyterLab
    labShell.add(sidebar, 'left', { rank: 600 });
  }
};

export default plugin;
