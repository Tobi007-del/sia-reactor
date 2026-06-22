import { CTX, NIL, INERTIA } from "@core/consts";
import { ReactorEvent } from "@core/event";
import type { Pure } from "@core/mixins";
import { Payload, ReactorMeta } from "@defs/reactor";
import type { DeepMerge, Unflatten, WildPaths, PathValue, PathBranchValue } from "@defs/obj";
import { transaction, txId } from "@modules/timeTravel/transaction";

export const arrRegex = /^([^\[\]]+)\[(\d+)\]$/;

// Type Guards

/** Checks if a value type is an object for common use cases. */
export function isObj<T extends object = object>(obj: any, arraycheck = true): obj is T {
  return "object" === typeof obj && obj !== null && (arraycheck ? !Array.isArray(obj) : true);
} // okay for common use cases but loose
/** Checks if a value is a "Plain Old Javascript Object". */
export function isPOJO<T extends object = object>(obj: any, config: { crossRealms?: boolean } = CTX.defaults, typecheck = true): obj is T {
  return (typecheck ? isObj(obj, false) : true) && (config.crossRealms ? Object.prototype.toString.call(obj) === "[object Object]" : obj.constructor === Object);
} // for strict own POJOs, handles cross-realm objects too

/** Returns whether a value can be proxied by the reactor runtime. */
export function canHandle(obj: any, config: { crossRealms?: boolean; preserveContext?: boolean } = CTX.defaults, typecheck = true): boolean {
  if ((typecheck && !isObj(obj, false)) || (obj as any)[INERTIA]) return false;
  if (Array.isArray(obj) || (!config.preserveContext && isPOJO(obj, config, false))) return true;
  if (config.preserveContext) return !(obj instanceof String) && !(obj instanceof Number) && !(obj instanceof Function) && !(obj instanceof Date) && !(obj instanceof Error) && !(obj instanceof RegExp) && !(obj instanceof Promise) && !(obj instanceof Map) && !(obj instanceof WeakMap) && !(obj instanceof Set) && !(obj instanceof WeakSet) && !(obj instanceof EventTarget); // matching types
  return false;
} // universal proxy gate for all reactive logic

// Deep Manipulation

/**
 * Gets a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * const name = getPath(state, "user.profile.name");
 */
export function getPath<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(source: T, key: P, separator: S = "." as S, keyFunc?: (p: string) => string): PathValue<T, P, S> {
  if (key === "*") return source as any;
  const keys = key.split(separator);
  let currObj: any = source;
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRegex);
    if (match) {
      const [, key, iStr] = match;
      if (!Array.isArray(currObj[key]) || !(key in currObj)) return undefined!;
      currObj = currObj[key][Number(iStr)];
    } else {
      if (!isObj<Record<string, any>>(currObj) || !(key in currObj)) return undefined!;
      currObj = currObj[key];
    }
  }
  return currObj;
}

/**
 * Sets a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * setPath(state, "user.profile.name", "Grace");
 * @example
 * const state = { users: [] as Array<{ name?: string }> };
 * setPath(state, "users.0.name", "Kosi"); // use `[n]` for arrays if uncertain so the indexes are not treated as object keys, i.e. { "0": { name: "Kosi" } } instead of { users: [ { name: "Kosi" } ] }
 */
export function setPath<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(target: T, key: P, value: PathValue<T, P, S>, separator: S = "." as S, keyFunc?: (p: string) => string): void {
  if (key === "*") return Object.assign(target, value);
  const keys = key.split(separator);
  for (let currObj: any = target, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRegex);
    if (match) {
      const [, key, iStr] = match;
      if (!Array.isArray(currObj[key])) currObj[key] = [];
      if (i === len - 1) currObj[key][Number(iStr)] = value;
      else (currObj[key][Number(iStr)] ||= {}), (currObj = currObj[key][Number(iStr)]);
    } else {
      if (i === len - 1) currObj[key] = value;
      else (currObj[key] ||= {}), (currObj = currObj[key]);
    }
  }
}

/**
 * Deletes a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * deletePath(state, "user.profile.name");
 */
export function deletePath<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(target: T, key: P, separator: S = "." as S, keyFunc?: (p: string) => string): void {
  if (key === "*") {
    const keys = Object.keys(target);
    for (let i = 0, len = keys.length; i < len; i++) delete (target as any)[keys[i]];
    return;
  }
  const keys = key.split(separator);
  for (let currObj: any = target, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRegex);
    if (match) {
      const [, key, iStr] = match;
      if (!Array.isArray(currObj[key]) || !(key in currObj)) return;
      if (i === len - 1) delete currObj[key][Number(iStr)];
      else currObj = currObj[key][Number(iStr)];
    } else {
      if (!isObj<Record<string, any>>(currObj) || !(key in currObj)) return;
      if (i === len - 1) delete currObj[key];
      else currObj = currObj[key];
    }
  }
}

/**
 * Checks whether a path exists.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * const ok = hasPath(state, "user.profile.name"); // default loose typing due to it's usecase
 */
export function hasPath<T extends object, const S extends string = ".", P extends string = string>(source: T, key: P, separator: S = "." as S, keyFunc?: (p: string) => string): boolean {
  if (key === "*") return true;
  const keys = key.split(separator);
  for (let currObj: any = source, i = 0, len = keys.length; i < len; i++) {
    const key = keyFunc ? keyFunc(keys[i]) : keys[i],
      match = key.includes("[") && key.match(arrRegex);
    if (match) {
      const [, key, iStr] = match;
      if (!Array.isArray(currObj[key]) || !(key in currObj)) return false;
      if (i === len - 1) return true;
      currObj = currObj[key][Number(iStr)];
    } else {
      if (!isObj<Record<string, any>>(currObj) || !(key in currObj)) return false;
      if (i === len - 1) return true;
      currObj = currObj[key];
    }
  }
  return true;
}

/**
 * Converts flattened keys into nested object structure.
 * @example
 * const flat = { "user.name": "Kosi", "user.role": "admin" };
 * const obj = parsePathObj(flat);
 */
export function parsePathObj<T extends Record<string, any>, const S extends string = ".">(obj: T, separator: S = "." as S, keyFunc = (p: string) => p, seen = new WeakSet()): Unflatten<T, S> {
  if (!isPOJO(obj) || seen.has(obj)) return obj as Unflatten<T, S>; // no circular references
  seen.add(obj);
  const result: any = {},
    keys = Object.keys(obj);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key: any = keys[i],
      val: any = obj[key];
    key === "*" || key.includes(separator) ? setPath(result, key, parsePathObj(val, separator, keyFunc, seen), separator, keyFunc) : (result[key] = isPOJO(val) ? parsePathObj(val, separator, keyFunc, seen) : val);
  }
  return result as Unflatten<T, S>;
}

/** Fast array scanner. Checks if a target path exactly matches or is a child of any path in the provided array. */
export function matchPaths(paths: string[], target: string): boolean {
  for (let i = 0, len = paths.length; i < len; i++) {
    const p = paths[i];
    if (target === p || target.startsWith(p + ".")) return true;
  }
  return false;
}

/** Counts the depth(number of dot(s)) in a path in the most optimized way possible. */
export function getDepth(path: string, depth = !path ? 0 : 1): number {
  for (let i = 0, len = path.length; i < len; i++) if (path.charCodeAt(i) === 46) depth++; // zero alloc; so when we say it's optmized, it's not cap :)
  return depth;
}

/** Normalizes boolean/object event options into a single options object. */
export function parseEvtOpts<T extends object, const K extends (keyof T)[] | readonly (keyof T)[], const O extends K[number] = K[0]>(options: T | boolean | undefined, opts: K, boolOpt: O = opts[0] as O, result = {} as T): T & { [P in O]-?: T[P] } {
  return Object.assign(result, "boolean" === typeof options ? { [boolOpt]: options } : options), result as T & { [P in O]-?: T[P] };
}

// Merging & Traversal

export interface FanoutOptionsTuple extends Partial<Record<(typeof fanoutOptsArr)[number], any>> {
  /** Whether to merge values before fanout, useful for patching usecases. @default  `false`. */
  merge?: boolean;
  /** How many levels to fan out, set based on your listener paths max dots. `true` is `Infinity`. @default  `1` for event cascading otherwise `Infinity`. */
  depth?: number | boolean;
  /** Whether to assign arrays as a whole and only touch `.length` for common cases. Only works with the `path` parameter overload or in nested levels.
   * Arrays can lead to unnecessary work as more often than not, you won't be watching index paths but waiting on the parent bubble instead.
   * If you happen to be watching, it might be more optimal to re-set it yourself if it's only a few indexes or just turn set this to `false`. */
  atomic?: boolean;
  /** Whether to skip `undefined` values during fanout. @default  `false`. */
  skipUndefined?: boolean;
  /** A label for the transaction that will be started, useful for debugging and tracking. @default  `Fanout -> "${path}"` : `Fanout`} (Tx ${CTX.txId})`. */
  txLabel?: string;
}
/**
 * Unified expansion utility.
 * Bridges Coarse (Immutable replacement) writes into Fine-grained (Reactive) writes by surgically
 * expanding a single object write into multiple granular child operations for deep optimal bubbling.
 * @example
 * // Event Mode (Cascading after-write)
 * rtr.on("user", (e) => fanout(e, { depth: 1 })); // defaults to 1 level deep for events
 * @example
 * // Direct Mode (Patching before-write)
 * fanout(state.user, { session: { id: 1, name: "Kosi", role: "admin" } }, { depth: Infinity }); // default to `Infinity` here
 */
export function fanout<T extends object>(event: ReactorEvent<T> | Payload<T>, options?: { crossRealms?: boolean } & FanoutOptionsTuple): void;
export function fanout<T extends object>(target: T, value: Partial<T> | Partial<Pure<T>>, options?: { crossRealms?: boolean } & FanoutOptionsTuple): void;
export function fanout<T extends object, P extends WildPaths<T> = WildPaths<T>>(state: T, path: P, value: Partial<PathValue<T, P>>, options?: { crossRealms?: boolean } & FanoutOptionsTuple): void;
export function fanout(a: any, b?: any, c?: any, d?: any): void {
  const isEvPd = !!a?.target,
    isPath = !isEvPd && "string" === typeof b,
    [state, path, olds, news, opts, type] = isEvPd ? [a.root, a.currentTarget.path, a.currentTarget.oldValue, a.currentTarget.value, b || NIL, a.type] : isPath ? [a, b, getPath(a, b), c, d || NIL, undefined] : [undefined, undefined, a, b, c || NIL, undefined],
    target = isEvPd ? getPath(a.root, a.currentTarget.path) : isPath ? getPath(state, path) : olds; // to avoid stale refs during write-walk
  if ((isEvPd && type !== "set" && type !== "delete") || !target || !canHandle(news, opts)) return;
  const func = () => {
    const walk = (target: any, obj: any, depth = isEvPd ? 1 : Infinity, keys = Object.keys(obj)) => {
      for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i],
          val = obj[key];
        try {
          if ((opts.atomic ?? true) && Array.isArray(val)) (target[key] = val), (target[key].length = target[key].length); // ping commoners
          else depth > 1 && canHandle(val, opts) ? walk((target[key] ||= {}), val, depth - 1) : (!opts.skipUndefined || val !== undefined) && (target[key] = val);
        } catch (e) {
          if (e instanceof RangeError) throw e; // internals can skip, not users
        } // call a spade a spade and just skip, no descriptor gymanstics
      }
    };
    if ((opts.atomic ?? true) && Array.isArray(news) && isPath) setPath(state, path, news), (getPath(state, path).length = news.length); // ping commoners
    else walk(target, opts.merge ? mergeObjs(olds, news, opts) : news, opts.depth === true ? Infinity : opts.depth);
  };
  force(() => transaction(func, opts.txLabel ?? `${path ? `Fanout -> '${path}'` : `Fanout`} (Tx ${txId + 1})`), isEvPd); // if event or payload, already written values can bypass equality checks
}
export const fanoutOptsArr = ["merge", "depth", "atomic", "skipUndefined"] as const;

/**
 * Executes a task while forcing all reactive writes to bypass equality checks.
 * @param task The mutation logic to execute.
 * @param bool Override for ease of use in dynamic usecases, defaults to `true`
 * @returns The result of the task.
 */
export function force<T>(task: () => T, bool = true): T {
  const prev = CTX.usingForce;
  CTX.usingForce = bool;
  try {
    return task();
  } finally {
    CTX.usingForce = prev;
  }
}

/**
 * Deep-merges object-like values, does necessary checks so use without doubts. Only `o2` keys are checked when `skipUndefined` is true.
 * @example
 * const next = mergeObjs({ user: { name: "Kosi" } }, { user: { role: "admin" } }); // { ...o1, ...o2 } // o2 over o1 and deep!
 */
export function mergeObjs<T1 extends object, T2 extends object>(o1?: T1 | null, o2?: T2 | null, config?: { crossRealms?: boolean; skipUndefined?: boolean }, pojocheck?: boolean): DeepMerge<T1, T2>;
export function mergeObjs(o1?: any, o2?: any, config = NIL, pojocheck = true): any {
  if (pojocheck && (!isPOJO(o1 || NIL, config) || !isPOJO(o2 || NIL, config))) return o2;
  (o1 ||= {}), (o2 ||= {});
  const merged = config.skipUndefined ? { ...o1 } : { ...o1, ...o2 };
  if (config.skipUndefined) {
    const keys = Object.keys(o1);
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i],
        val = o2[key];
      if (val !== undefined) merged[key] = val;
    }
  }
  const keys = Object.keys(merged);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i],
      o1V = o1[key],
      o2V = o2[key];
    if (isPOJO(o1V, config) && isPOJO(o2V, config)) merged[key] = mergeObjs(o1V, o2V, config, false); // fewer writes is less costly here
  }
  return merged;
}

/** Returns [path, parent, value] records from root to the target path. */
export function getTrailRecords<T extends object>(obj: T, path: WildPaths<T>, reverse = false): [WildPaths<T>, PathBranchValue<T, WildPaths<T>>, PathValue<T, WildPaths<T>>][] {
  const parts = path.split("."),
    chain: ReturnType<typeof getTrailRecords<T>> = [["*", obj, obj]];
  for (let acc = "", currObj: any = obj, i = 0, len = parts.length; i < len; i++) {
    const part = parts[i];
    chain.push([(acc += (i ? "." : "") + part) as WildPaths<T>, currObj, (currObj = currObj?.[part])]); // one iteration per depth, one-time storage over rcurrent derivation
  }
  return reverse ? chain.reverse() : chain;
}

// Cloning

/**
 * Deep-clones supported object structures.
 * @example
 * const cloned = deepClone({ user: { name: "Kosi" } });
 */
export function deepClone<T>(obj: T, config: { crossRealms?: boolean; preserveContext?: boolean } = CTX.defaults, seen = new WeakMap()): T {
  if (!obj || "object" !== typeof obj) return obj;
  const cloned = seen.get(obj);
  if (cloned) return cloned;
  if (!canHandle(obj, config, false)) return obj; // no circular references
  const clone: any = config.preserveContext ? Object.create(Object.getPrototypeOf(obj)) : Array.isArray(obj) ? [] : {};
  seen.set(obj, clone);
  const keys = config.preserveContext ? Reflect.ownKeys(obj) : Object.keys(obj);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    try {
      clone[key] = deepClone((obj as any)[key], config, seen);
    } catch (e) {
      if (e instanceof RangeError) throw e; // internals can skip, not users
    } // call a spade a spade and just skip, no descriptor gymanstics
  }
  return clone;
} // POJO|Arr|Dynamic Deep cloner

// Destruction

/** Nulls all non-function instance properties across the prototype chain. */
export function nuke(target: any): void {
  const keys = Object.keys(target);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    if ("function" !== typeof target[key]) target[key] = null;
  }
}

// Metadata Operations

/**
 * Allows extending the context payload of a `Reactor` operation with custom meta properties for the duration of a function execution.
 * Temporarily merges provided meta into `CTX.meta` for the duration of `fn`. Restores the previous meta object after `fn` completes (even on `throw`).
 * @param props Meta properties to merge into the current context.
 */
export function withMeta<T>(props: ReactorMeta, fn: () => T): T {
  CTX.meta ??= {};
  const cache: Record<string, any> = {};
  for (const key in props) {
    cache[key] = (CTX.meta as any)[key];
    (CTX.meta as any)[key] = (props as any)[key];
  }
  try {
    return fn();
  } finally {
    for (const key in cache) {
      if (cache[key] === undefined) resetMeta(key as any);
      else (CTX.meta as any)![key] = cache[key];
    }
  }
}

/**
 * Resets a specific property in the global context meta and nullifies it if empty to stay on the fast path.
 * @param key The key of the meta property to be deleted before nullifying.
 */
export function resetMeta(key: keyof ReactorMeta) {
  if (!CTX.meta) return;
  delete CTX.meta[key];
  for (const _ in CTX.meta) return;
  CTX.meta = null;
}
