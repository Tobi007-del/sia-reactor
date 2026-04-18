export { F as FanoutTuple, f as arrRegex, g as canHandle, h as deepClone, i as deleteAny, j as fanout, k as fanoutOptsArr, l as getAny, m as getTrailRecords, n as inAny, o as isObj, p as isPOJO, q as mergeObjs, r as nuke, s as parseAnyObj, t as parseEvtOpts, u as setAny } from './index-2jKy98op.js';

declare function clamp(min: number | undefined, val: number, max?: number): number;

/**
 * setTimeout wrapper with optional AbortSignal and Window overrides.
 * @param handler Timeout callback or handler string.
 * @param timeout Delay in milliseconds.
 * @param args Optional args, where first may be AbortSignal and second may be Window to be consumed for enhancements.
 * @returns Timer id, or -1 when signal is already aborted.
 */
declare function setTimeout(handler: TimerHandler, timeout?: number, ...args: any[]): number;
/**
 * setInterval wrapper with optional AbortSignal and Window overrides.
 * @param handler Interval callback or handler string.
 * @param timeout Interval delay in milliseconds.
 * @param args Optional args, where first may be AbortSignal and second may be Window to be consumed for enhancements.
 * @returns Interval id, or -1 when signal is already aborted.
 */
declare function setInterval(handler: TimerHandler, timeout?: number, ...args: any[]): number;
/**
 * requestAnimationFrame wrapper with optional AbortSignal and Window overrides.
 * @param callback Frame callback.
 * @param sig Optional AbortSignal to cancel scheduled frame.
 * @param win Optional Window override.
 * @returns Frame request id, or -1 when signal is already aborted.
 */
declare function requestAnimationFrame(callback: FrameRequestCallback, sig?: AbortSignal, win?: Window & typeof globalThis): number;

/**
 * Walks an instance and its prototype chain, invoking a callback for each callable method.
 * @param owner Instance whose methods are inspected.
 * @param callback Invoked for each method name found.
 * @param skipOwn Skips owner-level methods when traversing own or parent prototypes.
 * @param nested Internal traversal flag, Override to `true` to avoid skipping own methods when `skipOwn` is `true`.
 */
declare function onAllMethods(owner: any, callback: (method: string, owner: any) => void, skipOwn?: boolean, nested?: boolean): void;
/**
 * Binds all discovered methods on an owner to the owner instance.
 * @param owner Instance whose methods should be bound.
 */
declare function bindAllMethods(owner: any): void;
/**
 * Wraps all discovered methods in a guard function, optionally binding before wrapping.
 * @param owner Instance whose methods should be wrapped.
 * @param guardFn Wrapper factory used for each method.
 * @param bound Binds methods to owner before wrapping when true.
 */
declare function guardAllMethods(owner: any, guardFn?: (fn: Function) => Function, bound?: boolean): void;
/**
 * Wraps a function with try/catch and async rejection handling.
 * @template T Function type to preserve.
 * @param fn Function to wrap.
 * @param onError Error handler for sync throws and async rejections.
 * @returns Guarded function with the same call signature.
 */
declare function guardMethod<T extends Function>(fn: T, onError?: (e: any) => void): T;

/** Keyboard matching configuration used by utility helpers. */
interface keysSettings {
    /** Disables key handling when true. */
    disabled?: boolean;
    /** Combos that should call preventDefault when matched. */
    overrides?: string[];
    /** Action map from action id to combo or combo list. */
    shortcuts?: Record<string, string | string[]>;
    /** Combos that should be rejected immediately. */
    blocks?: string[];
    /** Enables exact combo matching instead of subset matching. */
    strictMatches?: boolean;
    /** Combos that are allowed as pass-through key actions. */
    whitelist?: string[];
}
/** Canonical key-combo structure used by parser and serializer helpers. */
type KeyStruct = Record<"ctrlKey" | "shiftKey" | "altKey" | "metaKey", boolean> & {
    key: string;
};
/**
 * Parses a combo string into modifier flags + terminal key.
 * @param combo Key combo string (for example: `"ctrl+shift+z"`).
 * @returns Parsed key structure with boolean modifier flags.
 * @example
 * parseKeyCombo("ctrl+shift+z")
 * // => { ctrlKey: true, shiftKey: true, altKey: false, metaKey: false, key: "z" }
 */
declare function parseKeyCombo(combo: string): KeyStruct;
/**
 * Serializes a key structure or keyboard event into canonical combo form.
 * @param e KeyboardEvent-like object or parsed key structure.
 * @returns Canonical combo string (for example: `"ctrl+shift+z"`).
 */
declare function stringifyKeyEvent(e: KeyStruct | KeyboardEvent): string;
/**
 * Normalizes combo(s) by:
 * - lowercasing,
 * - aliasing `cmd -> meta`, `space -> " "`,
 * - preserving literal space/plus edge cases,
 * - sorting modifiers as `ctrl, alt, shift, meta`.
 * @param combo Raw combo or list of combos.
 * @returns Canonical combo string or list.
 * @example
 * cleanKeyCombo(["Shift+Ctrl+Z", "cmd+y"])
 * // => ["ctrl+shift+z", "meta+y"]
 */
declare function cleanKeyCombo(combo: string): string;
declare function cleanKeyCombo(combo: string[]): string[];
/**
 * Determines if actual combo satisfies required combo rule(s).
 * Non-strict mode performs subset matching (required keys must all be present).
 * Strict mode requires exact canonical equality.
 * @param required Required combo or combo list.
 * @param actual Actual combo string.
 * @param strict Whether to require exact match.
 * @returns `true` when match succeeds.
 */
declare function matchKeys(required: string | string[], actual: string, strict?: boolean): boolean;
/**
 * Resolves key-combo terms against settings:
 * - override, block, whitelist, and matched action id.
 * @param combo Canonical combo string.
 * @param settings Matching settings.
 * @returns Match resolution record.
 */
declare function getTermsForKey(combo: string, settings: keysSettings): {
    override: boolean;
    block: boolean;
    whitelisted: boolean;
    action: string | null;
};
/**
 * Evaluates whether a keyboard event is allowed and maps it to an action id.
 * Behavior order:
 * 1. hard gate checks (`disabled`, focused editable, button-space/enter),
 * 2. blocked combos,
 * 3. override combos (`preventDefault`),
 * 4. shortcut action match,
 * 5. whitelist pass-through.
 * @param e Browser keyboard event.
 * @param settings Matching settings.
 * @returns Action id, pass-through key, or `false` when denied.
 */
declare function keyEventAllowed(e: KeyboardEvent, settings: keysSettings): false | string;
/**
 * Formats one or many combos for human-readable UI labels.
 * @param combo Combo or combo list.
 * @returns Display label (for example: `" (ctrl+z) or (meta+z)"`).
 */
declare const formatKeyForDisplay: (combo: string | string[]) => string;
/**
 * Formats an action-shortcuts map for display labels.
 * @param keyShortcuts Action to combo(s) map.
 * @returns Action to display-label map.
 */
declare function formatKeyShortcutsForDisplay(keyShortcuts: Record<string, string | string[]>): Record<string, string>;
/**
 * Converts combo text into WAI-ARIA `aria-keyshortcuts` format.
 * - When `formatted=true`, `s` is treated as already display-formatted text.
 * - When `formatted=false`, `s` is treated as raw combo(s) and is first formatted.
 * @param s Combo text or combo list.
 * @param formatted Whether `s` is already display-formatted.
 * @returns Normalized aria-keyshortcuts string.
 * @example
 * parseForARIAKS(" (ctrl+z) or (meta+z)")
 * // => "Control+z Meta+z"
 * @example
 * parseForARIAKS(["ctrl+z", "meta+z"], false)
 * // => "Control+z Meta+z"
 */
declare function parseForARIAKS(s: string | string[], formatted?: boolean): string;

type Dataset = Record<string, string | number>;
type Style = Partial<CSSStyleDeclaration>;
declare function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Partial<HTMLElementTagNameMap[K]>, dataset?: Dataset, styles?: Style): HTMLElementTagNameMap[K];
declare function createEl(tag: string, props?: Partial<HTMLElement>, dataset?: Dataset, styles?: Style): HTMLElement | null;
declare function assignEl<K extends keyof HTMLElementTagNameMap>(el?: HTMLElementTagNameMap[K], props?: Partial<HTMLElementTagNameMap[K]>, dataset?: Dataset, styles?: Style): void;
declare function assignEl(el?: HTMLElement | null, props?: Partial<HTMLElement>, dataset?: Dataset, styles?: Style): void;

export { type KeyStruct, assignEl, bindAllMethods, clamp, cleanKeyCombo, createEl, formatKeyForDisplay, formatKeyShortcutsForDisplay, getTermsForKey, guardAllMethods, guardMethod, keyEventAllowed, type keysSettings, matchKeys, onAllMethods, parseForARIAKS, parseKeyCombo, requestAnimationFrame, setInterval, setTimeout, stringifyKeyEvent };
