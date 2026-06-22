import { StorageAdapter, AsyncStorageAdapter, StorageAdapterConstructor, AsyncStorageAdapterConstructor } from "./storage";
import { Inert } from "@defs/reactor";
import { Paths } from "@defs/obj";
import { FanoutOptionsTuple } from "@utils/obj";
import { ReactorModulePathConfig } from "../base";

export interface PersistConfig<T extends object, P extends Paths<T> = Paths<T>> extends ReactorModulePathConfig<T, P> {
  /** The key under which to store the persisted data. @default  `"REACTOR_STORE"` */
  key: string;
  /** Storage adapter class or instance to use, can satisfy `instanceof` or just definition, cast to `any` if the latter. */
  adapter: Inert<StorageAdapter> | Inert<AsyncStorageAdapter> | Inert<StorageAdapterConstructor> | Inert<AsyncStorageAdapterConstructor>; // pass in the instance if u wanna do custom config
  /** Throttle time for saving changes (in milliseconds). @default  `2500`ms */
  throttle: number;
  /** Fan out restored hydration writes so listeners/effects catch up. @default  `true` if async for predictability */
  fanout: boolean | FanoutOptionsTuple;
  /** Whether to enforce strict rules. e.g. saving before destruction, pagehide, visibilitychange, e.t.c. @default  `true`. */
  strict: boolean;
  /** Whether to hold the initial hydration payload in memory to hydrate late-attaching reactors, free memory with `.clearCache()`. @default  `false`. */
  cachePayload: boolean;
  /** Hook: Intercept/Modify data retrieved from adapter before it hits the Reactors.
   * @param payload The data retrieved from storage.
   * @returns The modified payload, or `false` to block hydration entirely.
   */
  beforeHydrate?: (payload: T) => T | boolean;
  /** Hook: Intercept/Modify data before it hits the adapter.
   * @param payload The serialized object ready to be saved.
   * @returns The modified payload, or `false` to block the save operation entirely.
   */
  beforeSave?: (payload: T) => T | boolean;
  /** Hook: Feedback loop for I/O operations.
   * @param payload The data that was attempted to be saved.
   * @param success Whether the persistence operation succeeded.
   * @param error If success is `false`, this contains the I/O error object, needs `throwErrors: true` on adapter.
   */
  onSave: (payload: T, success: boolean, error?: unknown) => void;
}

export interface PersistState {
  /** Whether the persisted data has been loaded. */
  hydrated: boolean;
}
