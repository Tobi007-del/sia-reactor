import { StorageAdapterConfig } from "../base";

export interface IndexedDBAdapterConfig extends StorageAdapterConfig, IDBTransactionOptions {
  /** The name of the IndexedDB database to be created or retrieved. */
  dbName: string;
  /** Database version tag to use during creation or retrieval. Bump this when making schema changes. */
  version: number;
  /** First store is default during operations if none is provided, i.e. ["VAULT", "TEMP"] -> clear(store = "VAULT") {} */
  stores: string[];
  /** return a preferred instance or `throw` to prevent accessing the database */
  onidb: () => any;
  /** Called when the database request needs to be upgraded */
  onupgradeneeded: (database: IDBDatabase, event: IDBVersionChangeEvent) => void;
  /** Called when the database version changes */
  onversionchange: (database: IDBDatabase, event: IDBVersionChangeEvent) => void;
  /** Called when the database request is successful */
  onsuccess: (database: IDBDatabase, event: Event) => void;
  /** Called when the database request fails */
  onerror: (error: DOMException | null, event: Event) => any;
  /** Called when the database request is blocked */
  onblocked: (event: IDBVersionChangeEvent) => void;
}