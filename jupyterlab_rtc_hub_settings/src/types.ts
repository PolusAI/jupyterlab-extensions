export interface IUserStatus {
  name: string;
  shared: boolean;
}

export type IUsersTableProps = {
  ar: IUserStatus[];
  updateUsers: (users: IUserStatus[]) => void;
  refreshUsers: () => void;
};
