import { getActiveEl } from "./dom";

/** Keyboard matching configuration used by utility helpers. */
export interface KeysSettings {
  /** Disables key handling when true. */
  disabled?: boolean;
  /** Combos that should call `preventDefault` when matched. */
  overrides?: string[];
  /** Action map from action id to combo or combo list. */
  shortcuts?: Record<string, string | string[]>;
  /** Combos that should be rejected immediately. */
  blocks?: string[];
  /** Enables exact combo matching instead of subset matching. */
  strictMatch?: boolean;
  /** Ranks shortcut matches by exactness before insertion order. Enabled by default. */
  rankedMatch?: boolean;
  /** Combos that are allowed as pass-through key actions. */
  whitelist?: string[];
}

/** Canonical key-combo structure used by parser and serializer helpers. */
export type KeyStruct = Record<"ctrlKey" | "shiftKey" | "altKey" | "metaKey", boolean> & { key: string };

/**
 * Global registry of native browser hotkeys and shortcut combinations, pass as `.blocks` in `Settings` config for `keyEventAllowed()` for better UX.
 * Used by the system to prevent default browser behaviors (e.g., zooming, tab switching, refreshing, or opening dev tools) inside the listener context.
 */
// prettier-ignore
export const KEYS_BLOCKS = ["Ctrl+Tab", "Ctrl+Shift+Tab", "Ctrl+PageUp", "Ctrl+PageDown", "Cmd+Option+ArrowRight", "Cmd+Option+ArrowLeft", "Ctrl+1", "Ctrl+2", "Ctrl+3", "Ctrl+4", "Ctrl+5", "Ctrl+6", "Ctrl+7", "Ctrl+8", "Ctrl+9", "Cmd+1", "Cmd+2", "Cmd+3", "Cmd+4", "Cmd+5", "Cmd+6", "Cmd+7", "Cmd+8", "Cmd+9", "Alt+ArrowLeft", "Alt+ArrowRight", "Cmd+ArrowLeft", "Cmd+ArrowRight", "Ctrl+r", "Ctrl+Shift+r", "F5", "Shift+F5", "Cmd+r", "Cmd+Shift+r", "Ctrl+h", "Ctrl+j", "Ctrl+d", "Ctrl+f", "Cmd+y", "Cmd+Option+b", "Cmd+d", "Cmd+f", "Ctrl+Shift+i", "Ctrl+Shift+j", "Ctrl+Shift+c", "Ctrl+u", "F12", "Cmd+Option+i", "Cmd+Option+j", "Cmd+Option+c", "Cmd+Option+u", "Ctrl+=", "Ctrl+-", "Ctrl+0", "Cmd+=", "Cmd+-", "Cmd+0", "Ctrl+p", "Ctrl+s", "Ctrl+o", "Cmd+p", "Cmd+s", "Cmd+o"], // JIT eats loops :)
  KEYS_MODS = ["ctrl", "shift", "alt", "meta"] as const,
  KEYS_CMODS = ["ctrl", "alt", "meta"] as const,
  KEYS_ALIAS: Record<string, string> = { cmd: "meta", space: " " };

/**
 * Parses a combo string into modifier flags + terminal key.
 * @param combo Key combo string (for example: `"ctrl+shift+z"`).
 * @returns Parsed key structure with boolean modifier flags.
 * @example
 * parseKeyCombo("ctrl+shift+z")
 * // => { ctrlKey: true, shiftKey: true, altKey: false, metaKey: false, key: "z" }
 */
export function parseKeyCombo(combo: string): KeyStruct {
  const parts = cleanKeyCombo(combo).toLowerCase().split("+");
  return { ctrlKey: parts.includes("ctrl"), shiftKey: parts.includes("shift"), altKey: parts.includes("alt"), metaKey: parts.includes("meta") || parts.includes("cmd"), key: parts.find((p) => !/^(ctrl|shift|alt|meta|cmd)$/.test(p)) || "" };
}

/**
 * Serializes a key structure or keyboard event into canonical combo form.
 * @param e KeyboardEvent-like object or parsed key structure.
 * @returns Canonical combo string (for example: `"ctrl+shift+z"`).
 */
export function stringifyKeyEvent(e: KeyStruct | KeyboardEvent): string {
  const parts: string[] = [];
  e.ctrlKey && parts.push("ctrl"), e.altKey && parts.push("alt"), e.shiftKey && parts.push("shift"), e.metaKey && parts.push("meta"), parts.push(e.key?.toLowerCase() ?? "");
  return parts.join("+");
}

/**
 * Normalizes combo(s) by:
 * - lowercasing,
 * - aliasing `cmd -> meta`, `space -> " "`,
 * - preserving literal space/plus edge cases,
 * - sorting modifiers as `ctrl, alt, shift, meta`.
 * @param combo Raw combo or list of combos.
 * @param mods Optional list of modifier keys to sort and filter by (default: `["ctrl", "shift", "alt", "meta"]`).
 * @returns Canonical combo string or list.
 * @example
 * cleanKeyCombo(["Shift+Alt+Ctrl+Z", "cmd+y"])
 * // => ["ctrl+shift+alt+z", "meta+y"]
 */
export function cleanKeyCombo(combo: string, mods?: string[]): string;
export function cleanKeyCombo(combo: string[], mods?: string[]): string[];
export function cleanKeyCombo(combo: string | string[], mods: string[] = KEYS_MODS as any): string | string[] {
  const clean = (combo: string): string => {
    if (combo === " " || combo === "+") return combo;
    combo = combo.replace(/\+\s*\+$/, "+plus");
    const p = combo
      .toLowerCase()
      .split("+")
      .filter((k) => k !== "")
      .map((k, _, __, tk = k.trim()) => KEYS_ALIAS[tk] || (tk === "plus" ? "+" : tk || " "));
    return [...p.filter((k) => mods.includes(k)).sort((a, b) => mods.indexOf(a) - mods.indexOf(b)), ...(p.filter((k) => !mods.includes(k)) || "")].join("+");
  };
  return Array.isArray(combo) ? combo.map(clean) : clean(combo);
}

/**
 * Determines if actual combo satisfies required combo rule(s).
 * Non-strict mode performs subset matching (required keys must all be present).
 * Strict mode requires exact canonical equality.
 * @param required Required combo or combo list.
 * @param actual Actual combo string.
 * @param strict Whether to require exact match.
 * @param clean Whether to clean the actual combo.
 * @returns `true` when match succeeds.
 */
export function matchKeys(required: string | string[], actual: string, strict = false, clean = true): boolean {
  if (clean) actual = cleanKeyCombo(actual);
  const match = (req: string, actual: string): boolean => {
    req = cleanKeyCombo(req);
    if (strict) return req === actual;
    const reqs = req.split("+"),
      reals = actual.split("+");
    for (const mod of KEYS_CMODS) if (reals.includes(mod) && !reqs.includes(mod)) return false; // no unrequested heavy mods
    return reqs.every((k) => reals.includes(k));
  };
  return Array.isArray(required) ? required.some((req) => match(req, actual)) : match(required, actual);
}

/**
 * Resolves key-combo terms against settings:
 * - override, block, whitelist, and matched action id.
 * @param combo Canonical combo string.
 * @param settings Matching settings.
 * @returns Match resolution record.
 */
export function getTermsForKey(combo: string, settings: KeysSettings): { override: boolean; block: boolean; whitelisted: boolean; action: string | null } {
  const terms = { override: false, block: false, whitelisted: false, action: null as string | null },
    { overrides = [], shortcuts = {}, blocks = [], strictMatch: stm = false, rankedMatch: ram = true, whitelist = [] } = settings || {};
  combo = cleanKeyCombo(combo);
  if (matchKeys(overrides, combo, stm, false)) terms.override = true;
  if (matchKeys(blocks, combo, stm, false)) terms.block = true;
  if (matchKeys(whitelist, combo, false)) terms.whitelisted = true;
  if (!ram) return (terms.action = Object.keys(shortcuts).find((id) => shortcuts[id] && matchKeys(shortcuts[id], combo, stm, false)) || null), terms;
  // prettier-ignore
  let bestA: string | null = null, bestE = false, bestL = 0;
  for (const id of Object.keys(shortcuts))
    for (const c of Array.isArray(shortcuts[id]) ? shortcuts[id] : [shortcuts[id]]) {
      // prettier-ignore
      const req = c && cleanKeyCombo(c), isE = req === combo, len = req ? req.split("+").length : 0;
      if (c && matchKeys(req, combo, stm, false) && (!bestA || (isE && !bestE) || (isE === bestE && len > bestL))) (bestA = id), (bestE = isE), (bestL = len);
    }
  return (terms.action = bestA), terms;
}

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
export function keyEventAllowed<const S extends KeysSettings>(e: KeyboardEvent, settings: S): false | (S["shortcuts"] extends object ? keyof S["shortcuts"] : never) | (S["whitelist"] extends readonly string[] ? (string[] extends S["whitelist"] ? never : S["whitelist"][number]) : never) {
  if (settings.disabled) return false;
  const activeEl = getActiveEl((e.target as Node)?.ownerDocument); // shadow DOM proof
  if ((e.key === " " || e.key === "Enter") && activeEl?.matches("button,input[type='button'],input[type='submit']")) return false;
  if (e.currentTarget !== activeEl && activeEl?.matches("input,textarea,[contenteditable],[role]") && !(e.key === "Escape" && !e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey)) return false;
  const combo = stringifyKeyEvent(e),
    { override, block, action, whitelisted } = getTermsForKey(combo, settings);
  if (block) return false;
  if (override) e.preventDefault();
  if (action) return action as any;
  if (whitelisted) return e.key.toLowerCase() as any;
  return false;
}

/**
 * Formats one or many combos for human-readable UI labels, prepends " " for fluid appending.
 * @param combo Combo or combo list.
 * @param keyFn Function to format each combo.
 * @returns Display label (for example: `" (ctrl+z) or (meta+z)"`).
 */
export const formatKeyTooltip = (combo: string | string[] = "", keyFn = (c = "") => cleanKeyCombo(c).replace(" ", "space")): string => {
  const combined = combo?.length ? (Array.isArray(combo) ? combo.map(keyFn).join(" or ") : keyFn(combo)) : "";
  return combined ? ` (${combined})` : "";
};

/**
 * Formats an action-shortcuts map for display labels.
 * @param keyShortcuts Action to combo(s) map.
 * @returns Action to display-label map.
 */
export function formatKeyShortcutsTooltip(keyShortcuts: Record<string, string | string[]> = {}, formatter = formatKeyTooltip): Record<string, string> {
  const shortcuts: Record<string, string> = {};
  for (const action of Object.keys(keyShortcuts)) shortcuts[action] = formatter(keyShortcuts[action]);
  return shortcuts;
}

/**
 * Converts combo text into WAI-ARIA `aria-keyshortcuts` format.
 * @param s Combo text or combo list.
 * @param format Whether to format to tooltip first.
 * @returns Normalized aria-keyshortcuts string.
 * @example
 * parseForARIAKS(" (ctrl+z) or (meta+z)")
 * // => "Control+z Meta+z"
 * @example
 * parseForARIAKS(["ctrl+z", "meta+z"], false)
 * // => "Control+z Meta+z"
 */
export function parseForARIAKS(s: string | string[] = "", format = true) {
  const m = { ctrl: "Control", cmd: "Meta", space: "Space", plus: "+" };
  return (!format && !Array.isArray(s) ? s : formatKeyTooltip(s))
    .toLowerCase()
    .replace(/[()]/g, "") // 1. Remove parens
    .replace(/\bor\b/g, " ") // 2. Replace "or" with the REQUIRED space
    .replace(/\w+/g, (k: any) => m[k as keyof typeof m] || k) // 3. Map keys (ctrl -> Control)
    .replace(/\s+/g, " ")
    .trim(); // 4. Cleanup extra spaces
} // W3 ARIA Key Shortcut
