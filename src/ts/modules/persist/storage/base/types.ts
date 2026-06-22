import { AsyncStorageAdapter, StorageAdapter } from ".";

export interface StorageAdapterConstructor<Config extends StorageAdapterConfig = StorageAdapterConfig> {
  new (config?: Partial<Config>): StorageAdapter<any, Config>;
}

export interface AsyncStorageAdapterConstructor<Config extends StorageAdapterConfig = StorageAdapterConfig> {
  new (config?: Partial<Config>): AsyncStorageAdapter<any, Config>;
}

export type JSONReplacer = ((this: any, key: string, value: any) => any) | (number | string)[] | null;

export type JSONReviver = ((this: any, key: string, value: any) => any) | undefined;

export interface StorageAdapterConfig {
  /** Default key for storage operations. */
  key: string;
  /** `JSON.stringify()` like replacer to be used where applicable. */
  replacer: JSONReplacer;
  /** `JSON.parse()` like reviver to be used where applicable. */
  reviver: JSONReviver;
  /** Flag to enable debug logging. */
  debug: boolean;
  /** Whether to throw errors along with the silent warnings on failures. */
  throwErrors: boolean;
}
