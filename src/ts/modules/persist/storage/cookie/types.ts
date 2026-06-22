import { StorageAdapterConfig } from "../base";

export interface CookieOptions {
  /** Cookie path scope, defaults to root for maximum accessibility. */
  path: string;
  /** Cookie domain scope, e.g. ".example.com". */
  domain: string;
  /** Cookie Secure attribute, defaults to `false` but should be `true` in production for HTTPS sites. */
  secure: boolean;
  /** Cookie SameSite attribute for CSRF protection, defaults to "Lax" for a balance of security and usability. */
  sameSite: "Strict" | "Lax" | "None";
  /** Cookie lifetime in seconds, e.g. 604800 for a week. */
  maxAge: number;
  /** Absolute cookie expiry date, e.g. (new Date()).setDate(new Date().getDate() + 7), "Wed, 21 Oct 2023 07:28:00 GMT" (UTC Format). */
  expires: string | Date;
}

export interface CookieAdapterConfig extends StorageAdapterConfig, CookieOptions {}

