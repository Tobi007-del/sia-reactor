// src/ts/core/consts.ts
var CTX = {
  /** Flag indicating whether the application is running in development mode. */
  isDevEnv: "undefined" !== typeof process ? process.env.NODE_ENV !== "production" : true,
  /** Flag indicating whether a cascade is currently ongoing so reactors can allow all writes. */
  isCascading: false,
  /** Active `Autotracker` instance, override for automatic dependency collection on `Reactor` traps. */
  autotracker: null
};
var RAW = /* @__PURE__ */ Symbol.for("S.I.A_RAW");
var INERTIA = /* @__PURE__ */ Symbol.for("S.I.A_INERTIA");
var REJECTABLE = /* @__PURE__ */ Symbol.for("S.I.A_REJECTABLE");
var INDIFFABLE = /* @__PURE__ */ Symbol.for("S.I.A_INDIFFABLE");
var TERMINATOR = /* @__PURE__ */ Symbol.for("S.I.A_TERMINATOR");
var VERSION = /* @__PURE__ */ Symbol.for("S.I.A_VERSION");
var SSVERSION = /* @__PURE__ */ Symbol.for("S.I.A_SNAPSHOT_VERSION");
var RTR_BATCH = "undefined" !== typeof window ? ("undefined" !== typeof queueMicrotask ? queueMicrotask : setTimeout).bind(window) : "undefined" !== typeof process && process.nextTick ? process.nextTick : setTimeout;
var RTR_LOG = console.log.bind(console, "[S.I.A Reactor]");
var EVT_OPTS = { LISTENER: ["capture", "depth", "once", "signal", "immediate"], MEDIATOR: ["lazy", "signal", "immediate"] };
var NIL = Object.freeze({});
var NOOP = () => {
};

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

export {
  CTX,
  RAW,
  INERTIA,
  REJECTABLE,
  INDIFFABLE,
  TERMINATOR,
  VERSION,
  SSVERSION,
  RTR_BATCH,
  RTR_LOG,
  EVT_OPTS,
  NIL,
  NOOP,
  arrRegex,
  isObj,
  isPOJO,
  canHandle,
  getAny,
  setAny,
  deleteAny,
  inAny,
  parseAnyObj,
  parseEvtOpts,
  fanout,
  fanoutOptsArr,
  mergeObjs,
  getTrailRecords,
  deepClone,
  nuke
};
