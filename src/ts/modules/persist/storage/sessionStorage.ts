import { StorageAdapterConfig, StorageAdapter } from "./base";

/**
 * - The SessionStorage Adapter (~5MB per origin per tab, browser-dependent).
 * - Provides an implementation of the `StorageAdapter` interface using the browser's `sessionStorage`.
 * Handles JSON serialization and deserialization, and includes error handling for unsupported environments.
 */
export class SessionStorageAdapter<S = any, Config extends StorageAdapterConfig = StorageAdapterConfig> extends StorageAdapter<S, Config> {
  public readonly name: string = "SessionStorage";
  /**
   * Reads and parses a value from sessionStorage.
   * @param key Storage key.
   * @returns Parsed value, or `undefined` when missing/unreadable.
   */
  public override get<T = S>(key = this.config.key, reviver = this.config.reviver): T | undefined {
    try {
      const v = sessionStorage.getItem(key);
      return v ? JSON.parse(v, reviver) : undefined;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return undefined;
    }
  }
  /**
   * Serializes and writes a value to sessionStorage.
   * @param key Storage key.
   * @param value Value to serialize.
   * @returns `true` when write succeeds, else `false`.
   */
  public override set<T = S>(key = this.config.key, value: T, replacer = this.config.replacer) {
    try {
      return sessionStorage.setItem(key, JSON.stringify(value, replacer as any)), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("setItem", undefined, key), false;
    }
  }
  /**
   * Removes a single key from sessionStorage.
   * @param key Storage key.
   * @returns `true` when removal succeeds, else `false`.
   */
  public override remove(key = this.config.key) {
    try {
      return sessionStorage.removeItem(key), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("removeItem", undefined, key), false;
    }
  }
  /**
   * Clears all sessionStorage entries for the current tab session.
   * @returns `true` when clear succeeds, else `false`.
   */
  public override clear() {
    try {
      return sessionStorage.clear(), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("clear", undefined), false;
    }
  }
}