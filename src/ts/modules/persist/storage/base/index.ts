import { StorageAdapterConfig } from "./types";

/**
 * Abstract base class for storage adapters, defines the interface and common functionality.
 * @typeParam Config Configuration object type for the adapter.
 */
export abstract class BaseStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> {
  public readonly name: string = "BaseStorageAdapter";
  public config: Config;
  protected warn = (act = "", mssg = "Support issue or Private Mode", key = "", store = "") => this.config.debug && console.warn(`[${this.constructor.name} \`${act}\`] Failed${key ? ` for ${key}` : ""}${store ? ` on "${store}"` : ""}${(this.config as any).dbName ? ` at ${(this.config as any).dbName}` : ""} (${mssg})`);
  constructor(config?: Partial<Config>) {
    this.config = { debug: false, ...config } as Config;
  }
}

/**
 * Abstract base class for storage adapters, defines the interface and common functionality.
 * Extend this class to implement specific synchronous storage mechanisms (e.g., LocalStorage).
 * @typeParam Config Configuration object type for the adapter.
 */
export abstract class StorageAdapter<S = any, Config extends StorageAdapterConfig = StorageAdapterConfig> extends BaseStorageAdapter<Config> {
  public readonly name: string = "StorageAdapter";
  public abstract get<T = S>(key: string): T | undefined;
  public abstract set<T = S>(key: string, value: T): boolean;
  public abstract remove(key: string): boolean;
  public abstract clear(): boolean;
}

/**
 * Abstract base class for asynchronous storage adapters, defines the interface and common functionality.
 * Extend this class to implement specific asynchronous storage mechanisms (e.g., IndexedDB).
 * @typeParam Config Configuration object type for the adapter.
 */
export abstract class AsyncStorageAdapter<S = any, Config extends StorageAdapterConfig = StorageAdapterConfig> extends BaseStorageAdapter<Config> {
  public readonly name: string = "AsyncStorageAdapter";
  public abstract get<T = S>(key: string): Promise<T | undefined>;
  public abstract set<T = S>(key: string, value: T): Promise<boolean>;
  public abstract remove(key: string): Promise<boolean>;
  public abstract clear(): Promise<boolean>;
}

export type * from "./types";
