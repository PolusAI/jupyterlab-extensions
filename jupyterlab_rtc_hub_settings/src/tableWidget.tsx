import React, { Component } from 'react';
import {IUsersTableProps, IUserStatus} from './types'

// Class for table of users
export class UsersTableWidget extends Component<IUsersTableProps, IUsersTableProps> {
    constructor(
        props: IUsersTableProps,
    ) {
        super(props);
        props.refreshUsers();
    }

    updateUser = (name: string) => {
        let props: IUsersTableProps = this.props;
        let index = props.ar.findIndex((user: IUserStatus) => (user.name==name));
        props.ar[index].shared = !props.ar[index].shared;
        props.updateUsers(props.ar);
    }
        

    render() {
        const tableRows = this.props.ar.map((user: IUserStatus) => {
            return (
                <tr>
                    <td>{user.name}</td>
                    <td><input type="checkbox" checked={user.shared} onChange={() => this.updateUser(user.name)}></input>
                    </td>
                </tr>
            )
        });


        // Assemble headers and rows in the full table
        return (
            <div>
                <table className='wipp-WippSidebar-table'>
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
            </div>
        );
    }
};