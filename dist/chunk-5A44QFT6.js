// src/ts/utils/keys.ts
function parseKeyCombo(combo) {
  const parts = cleanKeyCombo(combo).toLowerCase().split("+");
  return { ctrlKey: parts.includes("ctrl"), shiftKey: parts.includes("shift"), altKey: parts.includes("alt"), metaKey: parts.includes("meta") || parts.includes("cmd"), key: parts.find((p) => !["ctrl", "shift", "alt", "meta", "cmd"].includes(p)) || "" };
}
function stringifyKeyEvent(e) {
  const parts = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");
  parts.push(e.key?.toLowerCase() ?? "");
  return parts.join("+");
}
function cleanKeyCombo(combo) {
  const clean = (combo2) => {
    const m = ["ctrl", "alt", "shift", "meta"], alias = { cmd: "meta", space: " " };
    if (combo2 === " " || combo2 === "+") return combo2;
    combo2 = combo2.replace(/\+\s*\+$/, "+plus");
    const p = combo2.toLowerCase().split("+").filter((k) => k !== "").map((k) => alias[k] || (k === "plus" ? "+" : k.trim() || " "));
    return [...p.filter((k) => m.includes(k)).sort((a, b) => m.indexOf(a) - m.indexOf(b)), ...p.filter((k) => !m.includes(k)) || ""].join("+");
  };
  return Array.isArray(combo) ? combo.map(clean) : clean(combo);
}
function matchKeys(required, actual, strict = false) {
  actual = cleanKeyCombo(actual);
  const match = (required2, actual2) => {
    required2 = cleanKeyCombo(required2);
    if (strict) return required2 === actual2;
    const reqKeys = required2.split("+"), actKeys = actual2.split("+");
    return reqKeys.every((k) => actKeys.includes(k));
  };
  return Array.isArray(required) ? required.some((req) => match(req, actual)) : match(required, actual);
}
function getTermsForKey(combo, settings) {
  const terms = { override: false, block: false, whitelisted: false, action: null }, { overrides = [], shortcuts = {}, blocks = [], strictMatches: s = false, whitelist = [] } = settings || {};
  combo = cleanKeyCombo(combo);
  if (matchKeys(overrides, combo, s)) terms.override = true;
  if (matchKeys(blocks, combo, s)) terms.block = true;
  if (matchKeys(whitelist, combo)) terms.whitelisted = true;
  terms.action = Object.keys(shortcuts).find((key) => matchKeys(shortcuts[key], combo, s)) || null;
  return terms;
}
function keyEventAllowed(e, settings) {
  if (settings.disabled || (e.key === " " || e.key === "Enter") && (e.target?.ownerDocument || document).activeElement?.tagName === "BUTTON" || (e.target?.ownerDocument || document).activeElement?.matches("input,textarea,[contenteditable='true']")) return false;
  const combo = stringifyKeyEvent(e), { override, block, action, whitelisted } = getTermsForKey(combo, settings);
  if (block) return false;
  if (override) e.preventDefault();
  if (action) return action;
  if (whitelisted) return e.key.toLowerCase();
  return false;
}
var formatKeyForDisplay = (combo) => ` ${(Array.isArray(combo) ? combo : [combo]).map((c) => `(${cleanKeyCombo(c).replace(" ", "space")})`).join(" or ")}`;
function formatKeyShortcutsForDisplay(keyShortcuts) {
  const shortcuts = {};
  for (const action of Object.keys(keyShortcuts)) shortcuts[action] = formatKeyForDisplay(keyShortcuts[action]);
  return shortcuts;
}
function parseForARIAKS(s, formatted = true) {
  const m = { ctrl: "Control", cmd: "Meta", space: "Space", plus: "+" };
  return (formatted && !Array.isArray(s) ? s : formatKeyForDisplay(s)).toLowerCase().replace(/[()]/g, "").replace(/\bor\b/g, " ").replace(/\w+/g, (k) => m[k] || k).replace(/\s+/g, " ").trim();
}

// src/ts/utils/dom.ts
function createEl(tag, props, dataset, styles, el = tag ? document?.createElement(tag) : null) {
  return assignEl(el, props, dataset, styles), el;
}
function assignEl(el, props, dataset, styles) {
  if (!el) return;
  if (props) {
    for (const k of Object.keys(props)) if (props[k] !== void 0) el[k] = props[k];
  }
  if (dataset) {
    for (const k of Object.keys(dataset)) if (dataset[k] !== void 0) el.dataset[k] = String(dataset[k]);
  }
  if (styles) {
    for (const k of Object.keys(styles)) if (styles[k] !== void 0) el.style[k] = styles[k];
  }
}

export {
  parseKeyCombo,
  stringifyKeyEvent,
  cleanKeyCombo,
  matchKeys,
  getTermsForKey,
  keyEventAllowed,
  formatKeyForDisplay,
  formatKeyShortcutsForDisplay,
  parseForARIAKS,
  createEl,
  assignEl
};
