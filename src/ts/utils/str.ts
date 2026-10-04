// String/Path manipulations

/**
 * Mirrors paths between intent (write) and state (read) representations if applicable.
 * @param path The path to mirror.
 * @param read If true (default), mirrors from 'intent' to 'state'. If false, mirrors from 'state' to 'intent'.
 * @returns The mirrored path, or the original path if no substitution was made.
 */
export function mirror<T extends string>(path: T, read?: true): T extends `${infer P}intent${infer S}` ? `${P}state${S}` : T;
export function mirror<T extends string>(path: T, read: false): T extends `${infer P}state${infer S}` ? `${P}intent${S}` : T;
export function mirror(path: string, read = true): string {
  return read ? (!path.includes("intent") ? path : path.replace("intent", "state")) : !path.includes("state") ? path : path.replace("state", "intent");
}
