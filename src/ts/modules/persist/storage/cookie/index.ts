import { NIL } from "@core/consts";
import { StorageAdapter } from "../base";
import { CookieAdapterConfig, CookieOptions } from "./types";
import { COOKIE_ADAPTER_BUILD } from "./build";

/**
 * - The Cookie Storage Adapter (~4KB per cookie; practical total payload budget often ~30KB).
 * - Provides an implementation of the `StorageAdapter` interface using `document.cookie`.
 * Handles JSON serialization/deserialization and URL-safe key/value encoding.
 */
export class CookieAdapter<S = any, Config extends CookieAdapterConfig = CookieAdapterConfig> extends StorageAdapter<S, Config> {
  public readonly name: string = "Cookie";
  protected deets = (opts: Partial<CookieOptions> = NIL, _d = opts.domain ?? this.config.domain, _m = opts.maxAge ?? this.config.maxAge, _e = opts.expires ?? this.config.expires) => `Path=${opts.path ?? this.config.path}; SameSite=${opts.sameSite ?? this.config.sameSite}${_d ? `; Domain=${_d}` : ""}${opts.secure ?? this.config.secure ? "; Secure" : ""}${_m !== undefined ? `; Max-Age=${_m}` : ""}${_e !== undefined ? `; Expires=${_e instanceof Date ? _e.toUTCString() : _e}` : ""}`;
  constructor(build?: Partial<Config>) {
    super({ secure: "undefined" !== typeof window && location.protocol === "https:", ...COOKIE_ADAPTER_BUILD, ...build } as Config);
  }
  /**
   * Reads and parses a cookie visible to the current page scope.
   * @param key Cookie key.
   * @returns Parsed value, or `undefined` when missing/unreadable.
   */
  public override get<T = S>(key = this.config.key, reviver = this.config.reviver): T | undefined {
    try {
      const k = encodeURIComponent(key) + "=";
      for (const pair of document.cookie ? document.cookie.split("; ") : []) {
        if (!pair.startsWith(k)) continue;
        return JSON.parse(decodeURIComponent(pair.slice(k.length)), reviver);
      }
      return undefined;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return undefined;
    }
  }
  /**
   * Writes a cookie with optional per-call scope/lifetime overrides.
   * @param key Cookie key.
   * @param value Value to serialize.
   * @param opts Optional per-call cookie options.
   * @returns `true` when write succeeds, else `false`.
   */
  public override set<T = S>(key = this.config.key, value: T, opts?: Partial<CookieOptions>, replacer = this.config.replacer) {
    try {
      return (document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value, replacer as any))}; ${this.deets(opts)}`), true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("set", undefined, key), false;
    }
  }
  /**
   * Removes a cookie key using matching scope attributes.
   * @param key Cookie key.
   * @param opts Optional per-call scope overrides.
   * @returns `true` when removal succeeds, else `false`.
   */
  public override remove(key = this.config.key, opts?: Partial<CookieOptions>) {
    try {
      return (document.cookie = `${encodeURIComponent(key)}=; ${this.deets({ ...opts, maxAge: 0, expires: new Date(0) })}`), true; // standard deletion technique
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("remove", undefined, key), false;
    }
  }
  /**
   * Attempts to remove all visible cookie keys for the given scope.
   * @param opts Optional per-call scope overrides.
   * @returns `true` when clear succeeds, else `false`.
   */
  public override clear(opts?: Partial<CookieOptions>) {
    try {
      for (const pair of document.cookie ? document.cookie.split("; ") : []) {
        const idx = pair.indexOf("=");
        document.cookie = `${idx === -1 ? pair : pair.slice(0, idx)}=; ${this.deets({ ...opts, maxAge: 0, expires: new Date(0) })}`; // standard deletion technique
      }
      return true;
    } catch (e) {
      if (this.config.throwErrors) throw e;
      return this.warn("clear"), false;
    }
  }
}

export type * from "./types";
export * from "./build";
