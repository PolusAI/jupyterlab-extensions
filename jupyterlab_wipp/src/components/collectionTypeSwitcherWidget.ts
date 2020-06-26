import { Widget, PanelLayout } from '@lumino/widgets';

/**
 * Switcher widget for choosing WIPP Collection type to explore
 */
export class SwitcherWidget extends Widget {
    constructor(
        switchType: (type: number) => void
    ) {
        super();

        const layout = (this.layout = new PanelLayout());

        const switchPanel = new Widget();


        let ul = document.createElement('ul');
        ul.className = 'wipp-WippSidebar-switcher-list';

        let li1 = document.createElement('li');
        li1.className = 'wipp-WippSidebar-switcher-item';

        this._imageCollectionsButton = document.createElement('button');
        this._imageCollectionsButton.className = 'selected';
        this._imageCollectionsButton.value = 'Image Collections';
        this._imageCollectionsButton.onclick = () => {
            this._imageCollectionsButton.className = 'selected';
            this._csvCollectionsButton.className = 'normal';
            switchType(1);
        };
        this._imageCollectionsButton.innerText = 'Image Collections';

        li1.appendChild(this._imageCollectionsButton);
        ul.appendChild(li1);

        let li2 = document.createElement('li');
        li2.className = 'wipp-WippSidebar-switcher-item';

        this._csvCollectionsButton = document.createElement('button');
        this._csvCollectionsButton.className = 'normal';
        this._csvCollectionsButton.value = 'CSV Collections';
        this._csvCollectionsButton.onclick = () => {
            this._csvCollectionsButton.className = 'selected';
            this._imageCollectionsButton.className = 'normal';
            switchType(2);
        };
        this._csvCollectionsButton.innerText = 'CSV Collections';

        li2.appendChild(this._csvCollectionsButton);
        ul.appendChild(li2);

        switchPanel.node.appendChild(ul);
        layout.addWidget(switchPanel);
    }

    private _imageCollectionsButton: HTMLButtonElement;
    private _csvCollectionsButton: HTMLButtonElement;
}
