import { AsyncStorageAdapter } from "../base";
import { IndexedDBAdapterConfig } from "./types";
import { INDEXED_DB_ADAPTER_BUILD } from "./build";

/**
 * - The IndexedDB Adapter (quota-managed; typically tens of MB to GB).
 * - Provides an implementation of the `AsyncStorageAdapter` interface using the IndexedDB database.
 * Handles database connection management, object store setup, and includes error handling for unsupported environments and common issues, requires snapshots(non-proxies) for persistence.
 * *NOTE*: Doesn't support functions and every other structure that the `structuredClone` algorithm exempts as it is IndexedDB's internal serialization mechanism. Bump `version` if schema changes, e.g, adding a new store.
 */
export class IndexedDBAdapter<S = any, Config extends IndexedDBAdapterConfig = IndexedDBAdapterConfig> extends AsyncStorageAdapter<S, Config> {
  public readonly name: string = "IndexedDB";
  protected db?: IDBDatabase;
  constructor(build?: Partial<Config>) {
    super({ ...INDEXED_DB_ADAPTER_BUILD, ...build } as Config);
  }
  /**
   * Returns a connected IndexedDB instance, opening it when needed.
   * @returns Connected database handle.
   */
  public async idb(): Promise<IDBDatabase> {
    const idb = this.config.onidb();
    if (idb || this.db) return Promise.resolve(idb || this.db);
    return new Promise((res, rej) => {
      const req = indexedDB.open(this.config.dbName, this.config.version);
      req.onupgradeneeded = (e) => (this.config.onupgradeneeded(req.result, e), this.config.stores.forEach((s) => !req.result.objectStoreNames.contains(s) && req.result.createObjectStore(s)));
      req.onsuccess = (e) => (this.config.onsuccess(req.result, e), (req.result.onversionchange = (e) => (this.config.onversionchange(req.result, e), this.warn("update", "Updated in another tab"), req.result.close())), res((this.db = req.result)));
      req.onerror = (e) => (this.config.onerror(req.error, e), this.warn("open", "Something went wrong"), rej(req.error));
      req.onblocked = (e) => (this.config.onblocked(e), this.warn("open", "Close other tabs for updates"));
    });
  }
  /**
   * Reads a value by key from an object store.
   * @param key Record key.
   * @param store Optional object-store override.
   * @returns Stored value, or `undefined` when missing/unreadable.
   */
  public override async get<T = S>(key = this.config.key, store = this.config.stores[0], options: Partial<IDBTransactionOptions> = this.config): Promise<T | undefined> {
    try {
      const req = (await this.idb()).transaction(store, "readonly", options).objectStore(store).get(key);
      return new Promise((res) => (req.onsuccess = () => res(req.result)));
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("get", undefined, store), undefined;
    }
  }
  /**
   * Writes a value by key into an object store.
   * @param key Record key.
   * @param value Value to store.
   * @param store Optional object-store override.
   * @returns `true` when write succeeds, else `false`.
   */
  public override async set<T = S>(key = this.config.key, value: T, store = this.config.stores[0], options: Partial<IDBTransactionOptions> = this.config): Promise<boolean> {
    try {
      const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).put(value, key);
      return new Promise((res) => (req.onsuccess = () => res(true)));
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("put", undefined, store), false;
    }
  }
  /**
   * Deletes a value by key from an object store.
   * @param key Record key.
   * @param store Optional object-store override.
   * @returns `true` when delete succeeds, else `false`.
   */
  public override async remove(key = this.config.key, store = this.config.stores[0], options: Partial<IDBTransactionOptions> = this.config): Promise<boolean> {
    try {
      const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).delete(key);
      return new Promise((res) => (req.onsuccess = () => res(true)));
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("delete", undefined, store), false;
    }
  }
  /**
   * Clears one or more object stores.
   * @param stores Store name or list of store names to clear.
   * @returns `true` when all clears succeed, else `false`.
   */
  public override async clear(stores: string | string[] = this.config.stores, options: Partial<IDBTransactionOptions> = this.config): Promise<boolean> {
    let success = true;
    for (const store of Array.isArray(stores) ? stores : [stores])
      try {
        const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).clear();
        await new Promise((res) => (req.onsuccess = () => res(true)));
      } catch (e) {
        if (this.config.throwErrors) throw e;
        this.warn("clear", undefined, store), (success = false);
      }
    return success;
  }
}

export type * from "./types";
export * from "./build";
