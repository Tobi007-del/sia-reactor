import { StorageAdapter } from "../base";
import { MemoryAdapterConfig } from "./types";

/**
 * - The Memory Storage Adapter (RAM-bound; no fixed browser quota).
 * - Provides an implementation of the `StorageAdapter` interface using an in-memory `Map`.
 * Useful for testing or non-persistent storage needs, mimics the API and behavior of LocalStorage.
 */
export class MemoryAdapter<S = any, Config extends MemoryAdapterConfig = MemoryAdapterConfig> extends StorageAdapter<S, Config> {
  public readonly name: string = "Memory";
  constructor(build?: Partial<Config>) {
    super({ store: new Map(), ...build } as Config);
  }
  /**
   * Reads and parses a value from memory storage.
   * @param key Storage key.
   * @returns Parsed value, or `undefined` when missing/unreadable.
   */
  public override get<T = S>(key = this.config.key, reviver = this.config.reviver): T | undefined {
    try {
      const v = this.config.store.get(key);
      return v ? JSON.parse(v, reviver) : undefined;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return undefined;
    }
  }
  /**
   * Serializes and writes a value to memory storage.
   * @param key Storage key.
   * @param value Value to serialize.
   * @returns `true` when write succeeds, else `false`.
   */
  public override set<T = S>(key = this.config.key, value: T, replacer = this.config.replacer) {
    try {
      return this.config.store.set(key, JSON.stringify(value, replacer as any)), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("set", undefined, key), false;
    }
  }
  /**
   * Removes a single key from memory storage.
   * @param key Storage key.
   * @returns `true` when removal succeeds, else `false`.
   */
  public override remove(key = this.config.key) {
    try {
      return this.config.store.delete(key), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("remove", undefined, key), false;
    }
  }
  /**
   * Clears all entries from memory storage.
   * @returns `true` when clear succeeds, else `false`.
   */
  public override clear() {
    try {
      return this.config.store.clear(), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("clear", undefined), false;
    }
  }
}

export type * from "./types";
