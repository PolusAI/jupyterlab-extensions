import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

// export * from './version';
// export * from './widget';

import { requestAPI } from './handler';

/**
 * Initialization data for the polus-render extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'polus-render:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension polus-render is activated!');

    requestAPI<any>('get-example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The polus_render server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
