import { CTX } from "@core/consts";
import type { ReactorMeta } from "@defs/reactor";

/**
 * Starts a new metadata context by temporarily merging provided meta into `CTX.meta`.
 * Returns a restoration token containing previous values to be passed to `endMeta`.
 * @param props Meta properties to merge into the current context.
 */
export function startMeta(props: ReactorMeta): Record<string, any> {
  const meta: any = (CTX.meta ??= {}),
    cache: Record<string, any> = {};
  for (const key in props) {
    cache[key] = meta[key];
    meta[key] = (props as any)[key];
  }
  return cache;
}

/**
 * Ends a metadata context started with `startMeta`, restoring the previous meta state.
 * @param cache The restoration token returned from `startMeta`.
 */
export function endMeta(cache: Record<string, any>): void {
  const meta: any = CTX.meta;
  if (!meta) return;
  for (const key in cache) {
    if (cache[key] === undefined) resetMeta(key as any);
    else meta[key] = cache[key];
  }
}

/**
 * Allows extending the context payload of a `Reactor` operation with custom meta properties for the duration of a function execution.
 * Temporarily merges provided meta into `CTX.meta` for the duration of `fn`. Restores the previous meta object after `fn` completes (even on `throw`).
 * @param props Meta properties to merge into the current context.
 */
export function withMeta<T>(props: ReactorMeta, fn: () => T): T {
  const cache = startMeta(props);
  try {
    return fn();
  } finally {
    endMeta(cache);
  }
}

/**
 * Resets a specific property in the global context meta and nullifies it if empty to stay on the fast path.
 * @param key The key of the meta property to be deleted before nullifying.
 */
export function resetMeta(key: keyof ReactorMeta): void {
  if (!CTX.meta) return;
  delete CTX.meta[key];
  for (const _ in CTX.meta) return;
  CTX.meta = null;
}

/**
 * Executes a task while forcing all reactive writes to bypass equality checks.
 * @param task The mutation logic to execute.
 * @param bool Override for ease of use in dynamic usecases, defaults to `true`
 * @returns The result of the task.
 */
export function force<T>(task: () => T, bool = true): T {
  const prev = CTX.meta?.forced;
  (CTX.meta ??= {}).forced = bool;
  try {
    return task();
  } finally {
    prev !== undefined ? (CTX.meta.forced = prev) : resetMeta("forced");
  }
}
