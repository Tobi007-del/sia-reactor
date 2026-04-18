"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/ts/utils.ts
var utils_exports = {};
__export(utils_exports, {
  arrRegex: () => arrRegex,
  assignEl: () => assignEl,
  bindAllMethods: () => bindAllMethods,
  canHandle: () => canHandle,
  clamp: () => clamp,
  cleanKeyCombo: () => cleanKeyCombo,
  createEl: () => createEl,
  deepClone: () => deepClone,
  deleteAny: () => deleteAny,
  fanout: () => fanout,
  fanoutOptsArr: () => fanoutOptsArr,
  formatKeyForDisplay: () => formatKeyForDisplay,
  formatKeyShortcutsForDisplay: () => formatKeyShortcutsForDisplay,
  getAny: () => getAny,
  getTermsForKey: () => getTermsForKey,
  getTrailRecords: () => getTrailRecords,
  guardAllMethods: () => guardAllMethods,
  guardMethod: () => guardMethod,
  inAny: () => inAny,
  isObj: () => isObj,
  isPOJO: () => isPOJO,
  keyEventAllowed: () => keyEventAllowed,
  matchKeys: () => matchKeys,
  mergeObjs: () => mergeObjs,
  nuke: () => nuke,
  onAllMethods: () => onAllMethods,
  parseAnyObj: () => parseAnyObj,
  parseEvtOpts: () => parseEvtOpts,
  parseForARIAKS: () => parseForARIAKS,
  parseKeyCombo: () => parseKeyCombo,
  requestAnimationFrame: () => requestAnimationFrame,
  setAny: () => setAny,
  setInterval: () => setInterval,
  setTimeout: () => setTimeout2,
  stringifyKeyEvent: () => stringifyKeyEvent
});
module.exports = __toCommonJS(utils_exports);

// src/ts/core/consts.ts
var CTX = {
  /** Flag indicating whether the application is running in development mode. */
  isDevEnv: "undefined" !== typeof process ? process.env.NODE_ENV !== "production" : true,
  /** Flag indicating whether a cascade is currently ongoing so reactors can allow all writes. */
  isCascading: false,
  /** Active `Autotracker` instance, override for automatic dependency collection on `Reactor` traps. */
  autotracker: null
};
var INERTIA = /* @__PURE__ */ Symbol.for("S.I.A_INERTIA");
var RTR_BATCH = "undefined" !== typeof window ? ("undefined" !== typeof queueMicrotask ? queueMicrotask : setTimeout).bind(window) : "undefined" !== typeof process && process.nextTick ? process.nextTick : setTimeout;
var RTR_LOG = console.log.bind(console, "[S.I.A Reactor]");
var NIL = Object.freeze({});

// src/ts/utils/obj.ts
var arrRegex = /^([^\[\]]+)\[(\d+)\]$/;
function isObj(obj, arraycheck = true) {
  return "object" === typeof obj && obj !== null && (arraycheck ? !Array.isArray(obj) : true);
}
function isPOJO(obj, config = NIL, typecheck = true) {
  return (typecheck ? isObj(obj, false) : true) && (config.crossRealms ? Object.prototype.toString.call(obj) === "[object Object]" : obj.constructor === Object);
}
function canHandle(obj, config = NIL, typecheck = true) {
  if (typecheck && !isObj(obj, false) || obj[INERTIA]) return false;
  if (Array.isArray(obj) || !config.preserveContext && isPOJO(obj, config, false)) return true;
  if (config.preserveContext) return !(obj instanceof String) && !(obj instanceof Number) && !(obj instanceof Function) && !(obj instanceof Date) && !(obj instanceof Error) && !(obj instanceof RegExp) && !(obj instanceof Promise) && !(obj instanceof Map) && !(obj instanceof WeakMap) && !(obj instanceof Set) && !(obj instanceof WeakSet) && !(obj instanceof EventTarget);
  return false;
}
function getAny(source, key, separator = ".", keyFunc) {
  if (key === "*") return source;
  if (!key.includes(separator)) return source[keyFunc ? keyFunc(key) : key];
  const keys = key.split(separator);
  let currObj = source;
  for (let i = 0, len = keys.length; i < len; i++) {
    const key2 = keyFunc ? keyFunc(keys[i]) : keys[i], match = key2.includes("[") && key2.match(arrRegex);
    if (match) {
      const [, key3, iStr] = match;
      if (!Array.isArray(currObj[key3]) || !(key3 in currObj)) return void 0;
      currObj = currObj[key3][Number(iStr)];
    } else {
      if (!isObj(currObj) || !(key2 in currObj)) return void 0;
      currObj = currObj[key2];
    }
  }
  return currObj;
}
function setAny(target, key, value, separator = ".", keyFunc) {
  if (key === "*") return Object.assign(target, value);
  if (!key.includes(separator)) return void (target[keyFunc ? keyFunc(key) : key] = value);
  const keys = key.split(separator);
  for (let currObj = target, i = 0, len = keys.length; i < len; i++) {
    const key2 = keyFunc ? keyFunc(keys[i]) : keys[i], match = key2.includes("[") && key2.match(arrRegex);
    if (match) {
      const [, key3, iStr] = match;
      if (!Array.isArray(currObj[key3])) currObj[key3] = [];
      if (i === len - 1) currObj[key3][Number(iStr)] = value;
      else currObj[key3][Number(iStr)] ||= {}, currObj = currObj[key3][Number(iStr)];
    } else {
      if (i === len - 1) currObj[key2] = value;
      else currObj[key2] ||= {}, currObj = currObj[key2];
    }
  }
}
function deleteAny(target, key, separator = ".", keyFunc) {
  if (key === "*") {
    const keys2 = Object.keys(target);
    for (let i = 0, len = keys2.length; i < len; i++) delete target[keys2[i]];
    return;
  }
  if (!key.includes(separator)) return void delete target[keyFunc ? keyFunc(key) : key];
  const keys = key.split(separator);
  for (let currObj = target, i = 0, len = keys.length; i < len; i++) {
    const key2 = keyFunc ? keyFunc(keys[i]) : keys[i], match = key2.includes("[") && key2.match(arrRegex);
    if (match) {
      const [, key3, iStr] = match;
      if (!Array.isArray(currObj[key3]) || !(key3 in currObj)) return;
      if (i === len - 1) delete currObj[key3][Number(iStr)];
      else currObj = currObj[key3][Number(iStr)];
    } else {
      if (!isObj(currObj) || !(key2 in currObj)) return;
      if (i === len - 1) delete currObj[key2];
      else currObj = currObj[key2];
    }
  }
}
function inAny(source, key, separator = ".", keyFunc) {
  if (key === "*") return true;
  if (!key.includes(separator)) return key in source;
  const keys = key.split(separator);
  for (let currObj = source, i = 0, len = keys.length; i < len; i++) {
    const key2 = keyFunc ? keyFunc(keys[i]) : keys[i], match = key2.includes("[") && key2.match(arrRegex);
    if (match) {
      const [, key3, iStr] = match;
      if (!Array.isArray(currObj[key3]) || !(key3 in currObj)) return false;
      if (i === len - 1) return true;
      currObj = currObj[key3][Number(iStr)];
    } else {
      if (!isObj(currObj) || !(key2 in currObj)) return false;
      if (i === len - 1) return true;
      currObj = currObj[key2];
    }
  }
  return true;
}
function parseAnyObj(obj, separator = ".", keyFunc = (p) => p, seen = /* @__PURE__ */ new WeakSet()) {
  if (!isObj(obj) || seen.has(obj)) return obj;
  seen.add(obj);
  const result = {}, keys = Object.keys(obj);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i], val = obj[key];
    key === "*" || key.includes(separator) ? setAny(result, key, parseAnyObj(val, separator, keyFunc, seen), separator, keyFunc) : result[key] = isObj(val) ? parseAnyObj(val, separator, keyFunc, seen) : val;
  }
  return result;
}
function parseEvtOpts(options, opts, boolOpt = opts[0], result = {}) {
  return Object.assign(result, "boolean" === typeof options ? { [boolOpt]: options } : options), result;
}
function fanout(a, b, c, d) {
  const isEvPd = !!a?.target, isPath = !isEvPd && "string" === typeof b, [state, path, olds, news, opts, type] = isEvPd ? [a.root, a.currentTarget.path, a.currentTarget.oldValue, a.currentTarget.value, b || NIL, a.type] : isPath ? [a, b, getAny(a, b), c, d || NIL, void 0] : [void 0, void 0, a, b, c || NIL, void 0], target = isEvPd ? getAny(a.root, a.currentTarget.path) : isPath ? getAny(state, path) : olds;
  if (isEvPd && type !== "set" && type !== "delete" || !target || !canHandle(news, opts)) return;
  const prev = CTX.isCascading;
  CTX.isCascading = isEvPd;
  try {
    const walk = (target2, obj, depth = isEvPd ? 1 : Infinity, keys = Object.keys(obj)) => {
      for (let i = 0, len = keys.length; i < len; i++) {
        const key = keys[i], val = obj[key];
        try {
          if ((opts.atomic ?? true) && Array.isArray(val)) target2[key] = val, target2[key].length = target2[key].length;
          else depth > 1 && canHandle(val, opts) ? walk(target2[key] ||= {}, val, depth - 1) : target2[key] = val;
        } catch (e) {
          if (e instanceof RangeError) throw e;
        }
      }
    };
    if ((opts.atomic ?? true) && Array.isArray(news) && isPath) setAny(state, path, news), getAny(state, path).length = news.length;
    else walk(target, opts.merge ? mergeObjs(olds, news, opts) : news, opts.depth === true ? Infinity : opts.depth);
  } finally {
    CTX.isCascading = prev;
  }
}
var fanoutOptsArr = ["merge", "depth", "atomic"];
function mergeObjs(o1, o2, config, pojocheck = true) {
  if (pojocheck && (!isPOJO(o1 || NIL, config) || !isPOJO(o2 || NIL, config))) return o2;
  const merged = { ...o1 ||= {}, ...o2 ||= {} }, keys = Object.keys(merged);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i], o1C = o1[key], o2C = o2[key];
    if (isPOJO(o1C, config) && isPOJO(o2C, config)) merged[key] = mergeObjs(o1C, o2C, config, false);
  }
  return merged;
}
function getTrailRecords(obj, path, reverse = false) {
  const parts = path.split("."), chain = [["*", obj, obj]];
  for (let acc = "", currObj = obj, i = 0, len = parts.length; i < len; i++) {
    const part = parts[i];
    chain.push([acc += (i ? "." : "") + part, currObj, currObj = currObj?.[part]]);
  }
  return reverse ? chain.reverse() : chain;
}
function deepClone(obj, config = NIL, seen = /* @__PURE__ */ new WeakMap()) {
  if (!obj || "object" !== typeof obj) return obj;
  const cloned = seen.get(obj);
  if (cloned) return cloned;
  if (!canHandle(obj, config, false)) return obj;
  const clone = config.preserveContext ? Object.create(Object.getPrototypeOf(obj)) : Array.isArray(obj) ? [] : {};
  seen.set(obj, clone);
  const keys = config.preserveContext ? Reflect.ownKeys(obj) : Object.keys(obj);
  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i];
    try {
      clone[key] = deepClone(obj[key], config, seen);
    } catch (e) {
      if (e instanceof RangeError) throw e;
    }
  }
  return clone;
}
function nuke(target) {
  let proto = target;
  while (proto && proto !== Object.prototype) {
    const keys = Object.getOwnPropertyNames(proto);
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      if (key === "constructor") continue;
      const desc = Object.getOwnPropertyDescriptor(proto, keys[i]);
      if (desc && ("function" === typeof desc.value || desc.get || desc.set)) continue;
      proto[key] = null;
    }
    proto = Object.getPrototypeOf(proto);
  }
}

// src/ts/utils/num.ts
function clamp(min = 0, val, max = Infinity) {
  return Math.min(Math.max(val, min), max);
}

// src/ts/utils/fn.ts
function setTimeout2(handler, timeout, ...args) {
  const sig = args[0] instanceof AbortSignal ? args.shift() : void 0;
  if (sig?.aborted) return -1;
  const win = args[0] instanceof Window ? args.shift() : window;
  if (!sig) return win.setTimeout(handler, timeout, ...args);
  const id = win.setTimeout(() => (sig.removeEventListener("abort", kill), "string" === typeof handler ? new Function(handler) : handler(...args)), timeout), kill = () => win.clearTimeout(id);
  return sig.addEventListener("abort", kill, { once: true }), id;
}
function setInterval(handler, timeout, ...args) {
  const sig = args[0] instanceof AbortSignal ? args.shift() : void 0;
  if (sig?.aborted) return -1;
  const win = args[0] instanceof Window ? args.shift() : window, id = win.setInterval(handler, timeout, ...args);
  return sig?.addEventListener("abort", () => win.clearInterval(id), { once: true }), id;
}
function requestAnimationFrame(callback, sig, win = window) {
  if (sig?.aborted) return -1;
  if (!sig) return win.requestAnimationFrame(callback);
  const id = win.requestAnimationFrame((t) => (sig.removeEventListener("abort", kill), callback(t))), kill = () => win.cancelAnimationFrame(id);
  return sig.addEventListener("abort", kill, { once: true }), id;
}

// src/ts/utils/methd.ts
function onAllMethods(owner, callback, skipOwn = true, nested = false) {
  let proto = owner;
  while (proto && proto !== Object.prototype) {
    for (const method of Object.getOwnPropertyNames(proto)) {
      if (method === "constructor") continue;
      if (nested && skipOwn && Object.prototype.hasOwnProperty.call(owner, method)) continue;
      if ("function" === typeof Object.getOwnPropertyDescriptor(proto, method)?.value) callback(method, owner);
    }
    proto = Object.getPrototypeOf(proto), nested = true;
  }
}
function bindAllMethods(owner) {
  onAllMethods(owner, (method, owner2) => {
    owner2[method] = owner2[method].bind(owner2);
  });
}
function guardAllMethods(owner, guardFn = guardMethod, bound = true) {
  onAllMethods(owner, (method, owner2) => {
    owner2[method] = guardFn(bound ? owner2[method].bind(owner2) : owner2[method]);
  });
}
function guardMethod(fn, onError = (e) => console.error(e)) {
  return ((...args) => {
    try {
      const result = fn(...args);
      return result instanceof Promise ? result.catch((e) => onError(e)) : result;
    } catch (e) {
      onError(e);
    }
  });
}

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  arrRegex,
  assignEl,
  bindAllMethods,
  canHandle,
  clamp,
  cleanKeyCombo,
  createEl,
  deepClone,
  deleteAny,
  fanout,
  fanoutOptsArr,
  formatKeyForDisplay,
  formatKeyShortcutsForDisplay,
  getAny,
  getTermsForKey,
  getTrailRecords,
  guardAllMethods,
  guardMethod,
  inAny,
  isObj,
  isPOJO,
  keyEventAllowed,
  matchKeys,
  mergeObjs,
  nuke,
  onAllMethods,
  parseAnyObj,
  parseEvtOpts,
  parseForARIAKS,
  parseKeyCombo,
  requestAnimationFrame,
  setAny,
  setInterval,
  setTimeout,
  stringifyKeyEvent
});
