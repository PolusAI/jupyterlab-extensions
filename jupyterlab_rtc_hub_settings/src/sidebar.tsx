import { Widget, PanelLayout } from '@lumino/widgets';
import { requestAPI } from './handler';
import { IUserStatus } from './types';
import { UsersTableWidget } from './tableWidget'
import { ToolbarWidget } from './toolbarWidget'
import { ReactWidget, UseSignal } from '@jupyterlab/apputils';
import { Signal } from '@lumino/signaling';


import React from 'react';

/**
 * Sidebar widget for displaying RTC sharing settings.
 */
export class SharingSettingsSidebar extends Widget {
    constructor() {
        super();

        this.addClass('wipp-WippSidebar');

        // Define widget layout
        let layout = (this.layout = new PanelLayout());

        // Add Toolbar widget
        let toolbar = new ToolbarWidget(() => { this._getUsers() });
        layout.addWidget(toolbar);

        // Add Users table widget
        let table = ReactWidget.create(
            <UseSignal signal={this._valueChanged} initialArgs={this._users}>
                {(_, oa) => <UsersTableWidget
                    ar={oa!}
                    updateUsers={(arg0) => this._updateUsers(arg0)}
                    refreshUsers={() => this._getUsers()}
                ></UsersTableWidget>
                }
            </UseSignal>
        )
        table.addClass('wipp-WippSidebar-table-div');
        layout.addWidget(table);
    }

    private async _getUsers() {
        // Return results of API request
        requestAPI<IUserStatus[]>('users')
            .then(response => {
                // Update internal variable
                this._users = response;

                // Send signal for table widget to update data
                this._valueChanged.emit(this._users);
            })
    }

    private async _updateUsers(users: IUserStatus[]) {
        // Send updated list of users statuses
        requestAPI<IUserStatus[]>('users', {
            method: 'POST',
            body: JSON.stringify(users)
        })
            .then(response => {
                // Update internal variable
                this._users = response;

                // Send signal for table widget to update data
                this._valueChanged.emit(this._users);
            })
    }

    private _users: IUserStatus[] = [];
    private _valueChanged = new Signal<this, IUserStatus[]>(this);
}