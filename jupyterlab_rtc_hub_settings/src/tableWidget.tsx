import React, { Component } from 'react';
import { IUsersTableProps, IUserStatus } from './types';

// Class for table of users
export class UsersTableWidget extends Component<
  IUsersTableProps,
  IUsersTableProps
> {
  constructor(props: IUsersTableProps) {
    super(props);
    props.refreshUsers();
  }

  updateUser = (name: string): void => {
    const props: IUsersTableProps = this.props;
    const index = props.ar.findIndex((user: IUserStatus) => user.name === name);
    props.ar[index].shared = !props.ar[index].shared;
    props.updateUsers(props.ar);
  };

  render(): JSX.Element {
    const tableRows = this.props.ar.map((user: IUserStatus) => {
      return (
        <tr>
          <td>{user.name}</td>
          <td>
            <input
              type="checkbox"
              checked={user.shared}
              onChange={() => this.updateUser(user.name)}
            ></input>
          </td>
        </tr>
      );
    });

    // Assemble headers and rows in the full table
    return (
      <div>
        <table className="rtc-hub-settings-SharingSettingsSidebar-table">
          <tbody>{tableRows}</tbody>
        </table>
      </div>
    );
  }
}
