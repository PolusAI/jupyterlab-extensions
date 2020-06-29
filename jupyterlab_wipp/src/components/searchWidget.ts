import { Widget, PanelLayout } from '@lumino/widgets';
import { ToolbarButton } from '@jupyterlab/apputils';
import { searchIcon, closeIcon } from '@jupyterlab/ui-components';

/**
 * Search widget on top of WIPP Panel.
 */
export class SearchWidget extends Widget {
    constructor(
        placeholder: () => string,
        updateWidget: (arg0: string) => void
    ) {
        super();
        this._getPlaceholder = placeholder;

        this.addClass('wipp-WippSidebar-search-layout');
        const layout = (this.layout = new PanelLayout());

        // Search input bar for imageCollections
        const searchBar = new Widget();
        searchBar.addClass('wipp-WippSidebar-search');
        this._searchBar = document.createElement('input');
        this._searchBar.placeholder = this._getPlaceholder();
        this._searchBar.oninput = async () => {
            updateWidget(this._searchBar.value);
        }
        searchBar.node.appendChild(this._searchBar);
        layout.addWidget(searchBar);

        // Clear search bar button
        const clearButton = new ToolbarButton({
            tooltip: 'CLEAR SEARCH BAR:',
            icon: closeIcon,
            onClick: async () => {
                updateWidget("");
                this._searchBar.value = "";
            }
        });
        layout.addWidget(clearButton);

        // Search button
        const searchButton = new ToolbarButton({
            icon: searchIcon,
            onClick: async () => {
                updateWidget(this._searchBar.value);
            }
        });
        layout.addWidget(searchButton);
    }

    onUpdateRequest() {
        this._searchBar.value = "";
        this._searchBar.placeholder = this._getPlaceholder();
    }

    private _searchBar: HTMLInputElement;
    private _getPlaceholder: () => string;
}
