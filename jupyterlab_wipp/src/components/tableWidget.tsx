import React, { Component } from 'react';
import {
  IGenericCollection,
  IGenericTableHeaderComponentProps,
  IGenericTableRowComponentProps,
  IGenericTableProps,
  IGenericTableState
} from '../types'

/*
* React Component for table header
*/
export function TableHeaderComponent<T>(props: IGenericTableHeaderComponentProps<T>) {
  const tableHeaders = props.headers.map((value) => {

    return (
      // Column headers are clickable and will sort by that column on click
      <th onClick={evt => {
        props.sortFunction(value[0]);
        evt.stopPropagation();
      }}>
        <span> {value[1]} </span>
        {(value[0] == props.tableSortedKey && props.tableSortedDirection == true) && <span className="wipp-WippSidebar-table-header-sorted-ascending"> </span>}
        {(value[0] == props.tableSortedKey && props.tableSortedDirection == false) && <span className="wipp-WippSidebar-table-header-sorted-descending"> </span>}
      </th>
    )

  })

  return (
    <tr>
      {tableHeaders}
      {/* Extra column for import buttons with an empty header */}
      <th className="wipp-WippSidebar-table-header-import-column"></th>
    </tr>
  );
}

/**
 * React Component for table row containing single imageCollection
 */
export function TableRowComponent(props: IGenericTableRowComponentProps<IGenericCollection>) {
  const { el, headers, collectionUrl, injectCode } = props;

  // function to convert imagecollection size to human-readable format
  const sizeof = (bytes: number) => {
    if (bytes == 0) { return "0.00 B"; }
    const e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(0) + ' ' + ' KMGTP'.charAt(e) + 'B';
  }

  // Convert creation timestamp to human-readable format
  const date = new Date(el.creationDate.replace(/\b\+0000/g, ''));

  const allElsTemplates = {
    name: <td> <a href={collectionUrl + el.id} target="_blank"> {el.name} </a> </td>, //name of collection
    numberOfImages: <td className="wipp-WippSidebar-table-element"> {el.numberOfImages} </td>,
    imagesTotalSize: <td className="wipp-WippSidebar-table-element"> {sizeof(el.imagesTotalSize)} </td>,
    creationDate: <td className="wipp-WippSidebar-table-element"> {date.toLocaleString()} </td>, // Date of collection creation
  }

  const els = headers.map((value) => {
    if (value[0] == 'name') return allElsTemplates.name;
    if (value[0] == 'numberOfImages') return allElsTemplates.numberOfImages;
    if (value[0] == 'imagesTotalSize') return allElsTemplates.imagesTotalSize;
    if (value[0] == 'creationDate') return allElsTemplates.creationDate;
  });


  // return tr element
  return (
    <tr>
      {els}
      {/* Import button column element */}
      <td>
        <button
          type="button"
          className="bp3-button bp3-minimal jp-ToolbarButtonComponent minimal jp-Button"
          onClick={evt => {
            injectCode(el.id);
            evt.stopPropagation();
          }}>
          <span className="wipp-ImportIcon jp-Icon jp-Icon-16"></span>
        </button>
      </td>

    </tr>
  )
}

// Generic class for different types of tables (ImageCollection, CsvCollection, etc)
export class GenericTableWidget<T> extends Component<IGenericTableProps<IGenericCollection>, IGenericTableState<IGenericCollection>> {
  constructor(props: IGenericTableProps<IGenericCollection>) {
    super(props);

    this.state = {
      tableSortedKey: 'creationDate',
      tableSortedDirection: true
    };
  }

  // Apply sort to WIPP Collections Array
  // Update the React State
  sort(key: keyof IGenericCollection) {
    let ar = this.props.ar;
    let direction = this.state.tableSortedDirection;

    if (key == this.state.tableSortedKey) {
      direction = !direction;
    }

    ar.sort(function (a, b) {
      const x = a[key]; 
      const y = b[key];
      if (direction === true) {
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      }
      else {
        return ((x > y) ? -1 : ((x < y) ? 1 : 0));
      }
    });

    this.setState({ tableSortedDirection: direction, tableSortedKey: key });
  }

  render() {
    // Generate headers and rows of the table
    const tableHeaders = <TableHeaderComponent headers={this.props.tableHeader} tableSortedKey={this.state.tableSortedKey} tableSortedDirection={this.state.tableSortedDirection} sortFunction={key => this.sort(key)} />;
    const tableRows = this.props.ar.map((e) => <TableRowComponent key={e.id} el={e} headers={this.props.tableHeader} collectionUrl={this.props.collectionUrl} injectCode={this.props.codeInjector} />);


    // Assemble headers and rows in the full table
    return (
      <div>
        <table className='wipp-WippSidebar-table'>
          <thead>
            {tableHeaders}
          </thead>
          <tbody>
            {tableRows}
          </tbody>
        </table>
      </div>
    );
  }
};
