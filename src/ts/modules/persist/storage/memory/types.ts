import { StorageAdapterConfig } from "../base";

export interface MemoryAdapterConfig extends StorageAdapterConfig {
  /** stored as strings to mimic local constraints */
  store: Map<string, string>;
}
