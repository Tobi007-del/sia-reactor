import { StorageAdapterConfig, StorageAdapter } from "./base";

/**
 * - The LocalStorage Adapter (~5MB per origin, browser-dependent).
 * - Provides an implementation of the `StorageAdapter` interface using the browser's `localStorage`.
 * Handles JSON serialization and deserialization, and includes error handling for unsupported environments.
 */
export class LocalStorageAdapter<S = any, Config extends StorageAdapterConfig = StorageAdapterConfig> extends StorageAdapter<S, Config> {
  public readonly name: string = "LocalStorage";
  /**
   * Reads and parses a value from localStorage.
   * @param key Storage key.
   * @returns Parsed value, or `undefined` when missing/unreadable.
   */
  public override get<T = S>(key = this.config.key, reviver = this.config.reviver): T | undefined {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v, reviver) : undefined;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return undefined;
    }
  }
  /**
   * Serializes and writes a value to localStorage.
   * @param key Storage key.
   * @param value Value to serialize.
   * @returns `true` when write succeeds, else `false`.
   */
  public override set<T = S>(key = this.config.key, value: T, replacer = this.config.replacer) {
    try {
      return localStorage.setItem(key, JSON.stringify(value, replacer as any)), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("setItem", undefined, key), false;
    }
  }
  /**
   * Removes a single key from localStorage.
   * @param key Storage key.
   * @returns `true` when removal succeeds, else `false`.
   */
  public override remove(key = this.config.key) {
    try {
      return localStorage.removeItem(key), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("removeItem", undefined, key), false;
    }
  }
  /**
   * Clears all localStorage entries for the current origin.
   * @returns `true` when clear succeeds, else `false`.
   */
  public override clear() {
    try {
      return localStorage.clear(), true; // Warning: This wipes the ENTIRE domain's LocalStorage
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("clear", undefined), false;
    }
  }
}