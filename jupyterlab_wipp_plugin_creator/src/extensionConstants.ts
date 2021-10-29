import { IStateDB } from '@jupyterlab/statedb';

export class ExtensionConstants {
  public static dbkey = 'wipp-plugin-creator:data';
}

export function addFilePathToDB(state: IStateDB, filepath: string): void {
  state.fetch(ExtensionConstants.dbkey).then(response => {
    const filepaths = response as string[];
    if (filepaths.indexOf(filepath) === -1) {
      filepaths.push(filepath);
    } else {
      console.log(`${filepath} was already added`);
    }
    state.save(ExtensionConstants.dbkey, filepaths);
  });
}
