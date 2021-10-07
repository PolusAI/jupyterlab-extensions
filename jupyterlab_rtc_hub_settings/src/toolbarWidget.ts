import { refreshIcon } from '@jupyterlab/ui-components';
import { PanelLayout, Widget } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';

export class ToolbarWidget extends Widget {
  constructor(refresh: () => void) {
    super();
    this.addClass('rtc-hub-settings-Toolbar-layout');

    const layout = (this.layout = new PanelLayout());

    const header = new Widget({ node: document.createElement('div') });
    header.node.textContent = 'Collaboration Sharing';
    layout.addWidget(header);

    const spacer = new Widget({ node: document.createElement('span') });
    spacer.addClass('rtc-hub-settings-Toolbar-spacer');
    layout.addWidget(spacer);

    // Search button
    const refreshButton = new ToolbarButton({
      icon: refreshIcon,
      onClick: refresh
    });
    layout.addWidget(refreshButton);
  }
}
