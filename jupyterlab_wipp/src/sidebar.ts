import { Widget } from '@phosphor/widgets';

/**
 * Sidebar widget for displaying WIPP image collections.
 */
export class WippSidebar extends Widget {
    /**
     * Create a new WIPP sidebar.
     */
    constructor() {
        super();
        this.addClass('wipp-WippSidebar');
        //let layout = (this.layout = new PanelLayout());
        //layout.addWidget(this._dashboard);
    }
}