import { CookieAdapterConfig } from ".";

export const COOKIE_ADAPTER_BUILD: Partial<CookieAdapterConfig> = {
  path: "/",
  sameSite: "Lax",
  domain: undefined,
  debug: false,
};
