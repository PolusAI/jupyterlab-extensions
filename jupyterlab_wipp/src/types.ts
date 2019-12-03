// Generic interface for any type of WIPP Collections
export interface IGenericCollection {
    id: string,
    [key: string]: any
}

export interface ITableSignal {
    collections_array: IGenericCollection[],
    code_injector: (id: string) => void;
    tableHeader: [keyof IGenericCollection, string][];
    collection_url_prefix: string;
}

// Interface for WIPP Image Collections
export interface IWippImageCollection extends IGenericCollection {
    id: string,
    name: string,
    creationDate: string,
    sourceJob: string,
    locked: boolean,
    pattern: any,
    numberOfImages: number,
    imagesTotalSize: number,
    numberImportingImages: number,
    numberOfImportErrors: number,
    numberOfMetadataFiles: number,
    metadataFilesTotalSize: number,
    _links: Object
}

// Interface for WIPP CSV Collections
export interface IWippCsvCollection extends IGenericCollection {
    id: string,
    name: string,
    creationDate: string,
    sourceJob: string,
    _links: Object
}

/**
 * Props for the generic table row React component
 */
export interface IGenericTableRowComponentProps<T> {
    el: T;
    headers: [keyof T, string][];
    collectionUrl: string;
    injectCode: (id: string) => void;
}

/**
 * Props for the table header React component
 */
export interface IGenericTableHeaderComponentProps<T> {
    headers: [keyof T, string][];
    tableSortedKey: keyof T;
    tableSortedDirection: boolean;
    sortFunction: (key: keyof T) => void;
}

export type IGenericTableProps<T> = {
    ar: T[];
    tableHeader: [keyof T, string][];
    collectionUrl: string;
    codeInjector: (id: string) => void;
}

export type IGenericTableState<T> = {
    tableSortedKey: keyof T;
    tableSortedDirection: boolean;
}