import { IndexedDBAdapterConfig } from "./types";
import { NOOP } from "@core/consts";

export const INDEXED_DB_ADAPTER_BUILD: Partial<IndexedDBAdapterConfig> = {
  dbName: "REACTOR_IDB",
  stores: ["VAULT"],
  version: 1,
  onidb: NOOP,
  onupgradeneeded: NOOP,
  onversionchange: NOOP,
  onsuccess: NOOP,
  onerror: NOOP,
  onblocked: NOOP,
};
