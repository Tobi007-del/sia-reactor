import { withMeta } from "@utils/obj";

/**
 * Executes `fn` with `silent: true` merged into all current `Reactor` payloads.
 * Use this to perform mutations you don't want recorded by `TimeTravelModule`.
 * @param fn Function to execute with `silent` meta.
 */
export function silence<T>(fn: () => T): T {
  return withMeta({ silent: true }, fn);
}

declare module "@defs/reactor" {
  interface ReactorMeta {
    /** Flag indicating whether the mutation was silenced and should not be recorded by the `TimeTravelModule`. */
    silent?: boolean;
  }
}
