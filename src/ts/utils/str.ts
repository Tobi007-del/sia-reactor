import { hasPath } from "./obj";

// String/Path manipulations

/**
 * Mirrors paths between intent (write) and state (read) representations if applicable.
 * @param path The path to mirror.
 * @param obj Object to verify path existence against via `hasPath`. If provided and the mirrored path does not exist, returns the original path.
 * @param read If true (default), mirrors from 'intent' to 'state'. If false, mirrors from 'state' to 'intent'.
 * @returns The mirrored path, or the original path if no substitution was made or target path is not in obj.
 */
export function mirror<T extends string>(path: T, obj?: object, read?: true): T extends `${infer P}intent${infer S}` ? `${P}state${S}` : T;
export function mirror<T extends string>(path: T, obj?: object, read?: false): T extends `${infer P}state${infer S}` ? `${P}intent${S}` : T;
export function mirror<T extends string>(path: T, read: false): T extends `${infer P}state${infer S}` ? `${P}intent${S}` : T;
export function mirror(path: string, obj?: object | boolean, read = true): string {
  if ("boolean" === typeof obj) (read = obj), (obj = undefined);
  const m = read ? (!path.includes("intent") ? path : path.replace("intent", "state")) : !path.includes("state") ? path : path.replace("state", "intent");
  return !obj || hasPath(obj, m) ? m : path;
}
