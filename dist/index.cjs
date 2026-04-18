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

// src/ts/index.ts
var index_exports = {};
__export(index_exports, {
  CTX: () => CTX,
  EVT_OPTS: () => EVT_OPTS,
  INDIFFABLE: () => INDIFFABLE,
  INERTIA: () => INERTIA,
  NIL: () => NIL,
  NOOP: () => NOOP,
  RAW: () => RAW,
  REJECTABLE: () => REJECTABLE,
  RTR_BATCH: () => RTR_BATCH,
  RTR_LOG: () => RTR_LOG,
  Reactor: () => Reactor,
  ReactorEvent: () => ReactorEvent,
  SSVERSION: () => SSVERSION,
  TERMINATOR: () => TERMINATOR,
  VERSION: () => VERSION,
  getRaw: () => getRaw,
  getSnapshotVersion: () => getSnapshotVersion,
  getVersion: () => getVersion,
  inert: () => inert,
  intent: () => intent,
  isInert: () => isInert,
  isIntent: () => isIntent,
  isVolatile: () => isVolatile,
  live: () => live,
  methods: () => methods,
  reactive: () => reactive,
  stable: () => stable,
  state: () => state,
  volatile: () => volatile
});
module.exports = __toCommonJS(index_exports);

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
function parseEvtOpts(options, opts, boolOpt = opts[0], result = {}) {
  return Object.assign(result, "boolean" === typeof options ? { [boolOpt]: options } : options), result;
}
function getTrailRecords(obj, path, reverse = false) {
  const parts = path.split("."), chain = [["*", obj, obj]];
  for (let acc = "", currObj = obj, i = 0, len = parts.length; i < len; i++) {
    const part = parts[i];
    chain.push([acc += (i ? "." : "") + part, currObj, currObj = currObj?.[part]]);
  }
  return reverse ? chain.reverse() : chain;
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

// src/ts/core/event.ts
var ReactorEvent = class _ReactorEvent {
  /** No active propagation phase. */
  static NONE = 0;
  /** Capture phase: root to target parent. */
  static CAPTURING_PHASE = 1;
  /** Target phase: target listeners run. */
  static AT_TARGET = 2;
  /** Bubble phase: target parent to root. */
  static BUBBLING_PHASE = 3;
  /** Current propagation phase for this event instance. */
  eventPhase = _ReactorEvent.NONE;
  /** Current event type for the active propagation path, clone immediately if async */
  type;
  /**
   * Current target context for the active propagation path, clone immediately if async.
   * Also use to survive future object shape changes from nesting for a path callback.
   */
  currentTarget;
  /** Original event type before propagation remapping. */
  staticType;
  /** Original event target context. */
  target;
  /** Root reactive object for this event instance wave. */
  root;
  /** Original target path for this event instance wave. */
  path;
  /** Current value at the event target path. */
  value;
  /** Previous value at the event target path. */
  oldValue;
  /** Whether resolve/reject intent semantics are allowed for this event instance. */
  rejectable;
  /** Whether this event instance wave can bubble back up to ancestors or just capture down. */
  bubbles;
  /**
   * `DOMHighResTimeStamp` for this event instance payload for native event parity and accuracy.
   * Enable `eventTimeStamps` option, then use this over custom timestamps in listeners for accuracy.
   * */
  timestamp;
  /** The `Reactor` instance that dispatched this event instance. */
  reactor;
  _resolved = "";
  _rejected = "";
  _propagationStopped = false;
  _immediatePropagationStopped = false;
  /**
   * @param payload Source payload for this event instance.
   * @param reactor The `Reactor` instance creating this event instance.
   */
  constructor(payload, reactor) {
    this.staticType = this.type = payload.type;
    this.target = payload.target;
    this.currentTarget = payload.currentTarget;
    this.root = payload.root;
    this.path = payload.target.path;
    this.value = payload.target.value;
    this.oldValue = payload.target.oldValue;
    this.rejectable = payload.rejectable;
    this.bubbles = !!reactor.config.eventBubbling;
    if (reactor.config.eventTimeStamps) this.timestamp = performance.now();
    this.reactor = reactor;
  }
  /** Whether propagation has been stopped. */
  get propagationStopped() {
    return this._propagationStopped;
  }
  /** Stops propagation to remaining listeners in later nodes/phases. */
  stopPropagation() {
    this._propagationStopped = true;
  }
  /** Whether immediate propagation has been stopped. */
  get immediatePropagationStopped() {
    return this._immediatePropagationStopped;
  }
  /** Stops propagation immediately, including remaining listeners on current path. */
  stopImmediatePropagation() {
    this._propagationStopped = true;
    this._immediatePropagationStopped = true;
  }
  /** Resolution message for rejectable events. */
  get resolved() {
    return this._resolved;
  }
  /**
   * Marks a rejectable event as resolved.
   * @param message Optional resolution message or identity.
   * @example e.resolve("html5Tech"); // identity
   * @example e.resolve("API Load successful"); // message
   */
  resolve(message) {
    if (!this.rejectable) return this.reactor.log(`[ReactorEvent] Ignored \`resolve()\` call on a non-rejectable ${this.staticType} at "${this.path}"`);
    if (this.eventPhase !== _ReactorEvent.CAPTURING_PHASE) this.reactor.log(`[ReactorEvent] Resolving an intent on ${this.staticType} at "${this.path}" outside of the capture phase is unadvised.`);
    if (this.rejectable) this.reactor.log(`[ReactorEvent] ${this._resolved = message || `Could ${this.staticType} intended value at "${this.path}"`}`);
  }
  /** Rejection reason for rejectable events. */
  get rejected() {
    return this._rejected;
  }
  /**
   * Marks a rejectable event as rejected.
   * @param reason Optional rejection reason or identity.
   * @example e.resolve("html5Tech"); // identity
   * @example e.resolve("User is not logged in"); // reason
   */
  reject(reason) {
    if (!this.rejectable) return this.reactor.log(`[ReactorEvent] Ignored \`reject()\` call on a non-rejectable ${this.staticType} at "${this.path}"`);
    if (this.eventPhase !== _ReactorEvent.CAPTURING_PHASE) this.reactor.log(`[ReactorEvent] Rejecting an intent on ${this.staticType} at "${this.path}" outside of the capture phase is unadvised.`);
    if (this.rejectable) this.reactor.log(`[ReactorEvent] ${this._rejected = reason || `Couldn't ${this.staticType} intended value at "${this.path}"`}`);
  }
  /**
   * Returns event path values from target to root.
   * @returns Composed path values in bubbling order.
   */
  composedPath() {
    return getTrailRecords(this.root, this.path, true).map((r) => r[2]);
  }
};

// src/ts/core/reactor.ts
var Reactor = class {
  /** Logger function for this reactor instance, override if desired, `this.canLog = false` resets. */
  log = NOOP;
  /** The core state object for this reactor instance. */
  core;
  // `?:`s | pay the ~800 byte price upfront for what u might never use
  /** The modules being used by this reactor. */
  modules;
  /** Configuration options for this reactor instance. */
  config;
  /** Whether this reactor instance is currently batching updates, a window view into the engine timing */
  isBatching = false;
  // Async Batching
  queue;
  // Tasks to run after flush
  batch;
  // Batched payloads to flush async
  lineage;
  // { parent, key }: uses maths to avoid extra allocations for pairs
  snapCache;
  proxyCache = /* @__PURE__ */ new WeakMap();
  getters;
  setters;
  deleters;
  watchers;
  listeners;
  /**
   * Creates a new Reactor instance.
   * @param target Initial state target.
   * @param build Reactor bootstrap/build configuration.
   * @example
   * const rtr = new Reactor({ count: 0 });
   */
  constructor(target = {}, build) {
    this[INERTIA] = true;
    this.config = { crossRealms: false, smartCloning: false, eventBubbling: true, lineageTracing: false, preserveContext: false, equalityFunction: Object.is, batchingFunction: RTR_BATCH, ...build };
    this.core = this.proxied(target);
    if (build) this.canLog = !!build.debug;
  }
  proxied(target, rejectable = false, indiffable = false, parent, key, path) {
    if (!target || "object" !== typeof target) return target;
    target = target[RAW] || target;
    if (this.config.referenceTracking && parent && key && !this.link(target, parent, key, false)) return target;
    const cached = this.proxyCache.get(target);
    if (cached) return cached;
    if (!canHandle(target, this.config, false)) return target;
    rejectable ||= target[REJECTABLE];
    indiffable ||= target[INDIFFABLE];
    const proxy = new Proxy(target, {
      // Robust Proxy handler
      get: (object, key2, receiver) => {
        if (key2 === RAW) return this.log(`\u{1F440} [Reactor \`get\` Trap] Peeked at ${object}`), object;
        let value = !this.config.preserveContext ? object[key2] : Reflect.get(object, key2, receiver);
        const keyStr = String(key2), fullPath = path ? path + "." + keyStr : keyStr, paths = this.config.lineageTracing ? this.trace(object, keyStr) : fullPath;
        this.log(`\u{1F50D} [Reactor \`get\` Trap] Initiated for "${keyStr}" on "${paths}"`), CTX.autotracker?.track(fullPath, this);
        if (this.config.get) value = this.config.get(object, key2, value, receiver, paths);
        if (this.getters) {
          const wildcords = this.getters.get("*");
          for (let i = 0, len = this.config.lineageTracing ? paths.length : 1; i < len; i++) {
            const currPath = this.config.lineageTracing ? paths[i] : fullPath, cords = this.getters.get(currPath);
            if (!cords && !wildcords) continue;
            const target2 = { path: currPath, value, key: keyStr, hadKey: true, object: receiver }, payload = { type: "get", target: target2, currentTarget: target2, root: this.core, rejectable };
            if (cords) value = this.mediate(currPath, payload, "get", cords);
            if (!wildcords) continue;
            target2.value = value;
            value = this.mediate("*", payload, "get", wildcords);
          }
        }
        return this.proxied(value, rejectable, indiffable, object, keyStr, fullPath);
      },
      set: (object, key2, value, receiver) => {
        let unchanged, safeValue, safeOldValue, terminated = false;
        const keyStr = String(key2), fullPath = path ? path + "." + keyStr : keyStr, paths = this.config.lineageTracing ? this.trace(object, keyStr) : fullPath, loopLen = this.config.lineageTracing ? paths.length : 1, oldValue = !this.config.preserveContext ? object[key2] : Reflect.get(object, key2, receiver), hadKey = !this.config.preserveContext ? key2 in object : Reflect.has(object, key2);
        this.log(`\u270F\uFE0F [Reactor \`set\` Trap] Initiated for "${keyStr}" on "${paths}"`), CTX.autotracker?.track(fullPath, this, true);
        if (this.config.referenceTracking || !indiffable) {
          safeOldValue = oldValue?.[RAW] || oldValue;
          safeValue = value?.[RAW] || value;
          unchanged = this.config.equalityFunction(safeValue, safeOldValue);
        }
        if (!indiffable && unchanged && !CTX.isCascading) return this.log(`\u{1F504} [Reactor \`set\` Trap] Unchanged for "${keyStr}" on "${paths}"`), true;
        if (this.config.set) terminated = (value = this.config.set(object, key2, value, oldValue, receiver, paths)) === TERMINATOR;
        if (this.setters) {
          const wildcords = this.setters.get("*");
          for (let i = 0; i < loopLen; i++) {
            const currPath = this.config.lineageTracing ? paths[i] : fullPath, cords = this.setters.get(currPath);
            if (!cords && !wildcords) continue;
            const target2 = { path: currPath, value, oldValue, key: keyStr, hadKey, object: receiver }, payload = { type: "set", target: target2, currentTarget: target2, root: this.core, terminated, rejectable };
            if (cords) {
              const result2 = this.mediate(currPath, payload, "set", cords);
              if (!(terminated ||= payload.terminated)) value = result2;
            }
            if (!wildcords) continue;
            target2.value = value;
            const result = this.mediate("*", payload, "set", wildcords);
            if (!(terminated ||= payload.terminated)) value = result;
          }
        }
        if (terminated) return this.log(`\u{1F6E1}\uFE0F [Reactor \`set\` Trap] Terminated for "${keyStr}" on "${paths}"`), true;
        const success = !this.config.preserveContext ? (object[key2] = value, true) : Reflect.set(object, key2, value, receiver);
        if (!success) return this.log(`\u274C [Reactor \`set\` Trap] Failed for "${keyStr}" on "${paths}"`), false;
        if (this.config.referenceTracking && !unchanged) this.config.smartCloning && this.stamp(object), this.unlink(safeOldValue, object, keyStr), this.link(safeValue, object, keyStr);
        if (this.watchers || this.listeners)
          for (let i = 0; i < loopLen; i++) {
            const currPath = this.config.lineageTracing ? paths[i] : fullPath, target2 = { path: currPath, value, oldValue, key: keyStr, hadKey, object: receiver };
            this.notify(currPath, { type: "set", target: target2, currentTarget: target2, root: this.core, terminated, rejectable });
          }
        return true;
      },
      deleteProperty: (object, key2) => {
        let value, receiver = this.proxyCache.get(object), terminated = false;
        const keyStr = String(key2), fullPath = path ? path + "." + keyStr : keyStr, paths = this.config.lineageTracing ? this.trace(object, keyStr) : fullPath, loopLen = this.config.lineageTracing ? paths.length : 1, oldValue = !this.config.preserveContext ? object[key2] : Reflect.get(object, key2, receiver), hadKey = !this.config.preserveContext ? key2 in object : Reflect.has(object, key2);
        this.log(`\u{1F5D1}\uFE0F [Reactor \`deleteProperty\` Trap] Initiated for "${keyStr}" on "${paths}"`), CTX.autotracker?.track(fullPath, this, true);
        if (this.config.deleteProperty) terminated = (value = this.config.deleteProperty(object, key2, oldValue, receiver, paths)) === TERMINATOR;
        if (this.deleters) {
          const wildcords = this.deleters.get("*");
          for (let i = 0; i < loopLen; i++) {
            const currPath = this.config.lineageTracing ? paths[i] : fullPath, cords = this.deleters.get(currPath);
            if (!cords && !wildcords) continue;
            const target2 = { path: currPath, value, oldValue, key: keyStr, hadKey, object: receiver }, payload = { type: "delete", target: target2, currentTarget: target2, root: this.core, rejectable };
            if (cords) {
              const result2 = this.mediate(currPath, payload, "delete", cords);
              if (!(terminated ||= payload.terminated)) value = result2;
            }
            if (!wildcords) continue;
            const result = this.mediate("*", payload, "delete", wildcords);
            if (!(terminated ||= payload.terminated)) value = result;
          }
        }
        if (terminated) return this.log(`\u{1F6E1}\uFE0F [Reactor \`deleteProperty\` Trap] Terminated for "${keyStr}" on "${paths}"`), true;
        const success = !this.config.preserveContext ? delete object[key2] : Reflect.deleteProperty(object, key2);
        if (!success) return this.log(`\u274C [Reactor \`deleteProperty\` Trap] Failed for "${keyStr}" on "${paths}"`), false;
        if (this.config.referenceTracking) this.config.smartCloning && this.stamp(object), this.unlink(oldValue?.[RAW] || oldValue, object, keyStr);
        if (this.watchers || this.listeners)
          for (let i = 0; i < loopLen; i++) {
            const currPath = this.config.lineageTracing ? paths[i] : fullPath, target2 = { path: currPath, value, oldValue, key: keyStr, hadKey, object: receiver };
            this.notify(currPath, { type: "delete", target: target2, currentTarget: target2, root: this.core, rejectable });
          }
        return true;
      },
      has: (object, key2) => {
        let has = !this.config.preserveContext ? key2 in object : Reflect.has(object, key2);
        const keyStr = String(key2), fullPath = path ? path + "." + keyStr : keyStr;
        this.log(`\u2753 [Reactor \`has\` Trap] Initiated for "${keyStr}" on "${fullPath}"`), CTX.autotracker?.track(fullPath, this);
        if (this.config.has) has = this.config.has(object, key2, has, this.proxyCache.get(object), fullPath);
        return has;
      },
      getOwnPropertyDescriptor: (object, key2) => {
        let descriptor = !this.config.preserveContext ? Object.getOwnPropertyDescriptor(object, key2) : Reflect.getOwnPropertyDescriptor(object, key2);
        const keyStr = String(key2), fullPath = path ? path + "." + keyStr : keyStr;
        this.log(`\u{1F4CB} [Reactor \`getOwnPropertyDescriptor\` Trap] Initiated for "${keyStr}" on "${fullPath}"`), CTX.autotracker?.track(fullPath, this);
        if (this.config.getOwnPropertyDescriptor) descriptor = this.config.getOwnPropertyDescriptor(object, key2, descriptor, this.proxyCache.get(object), this.config.lineageTracing ? this.trace(object, keyStr) : fullPath);
        return descriptor;
      },
      ownKeys: (object) => {
        let ownKeys = Reflect.ownKeys(object);
        const safePath = path || "*";
        this.log(`\u{1F511} [Reactor \`ownKeys\` Trap] Initiated on "${safePath}"`), CTX.autotracker?.track(safePath, this);
        if (this.config.ownKeys) ownKeys = this.config.ownKeys(object, ownKeys, this.proxyCache.get(object), safePath);
        return ownKeys;
      }
    });
    return this.proxyCache.set(target, proxy), proxy;
  }
  trace(target, path, paths = [], seen = /* @__PURE__ */ new WeakSet()) {
    if (Object.is(target, this.core[RAW] || this.core)) return paths.push(path), paths;
    if (seen.has(target)) return paths;
    seen.add(target);
    const es = (this.lineage ??= /* @__PURE__ */ new WeakMap()).get(target);
    if (!es) return paths;
    for (let i = 0, len = es.length; i < len; i += 2) {
      const prev = es[i + 1];
      this.trace(es[i], prev ? prev + "." + path : path, paths, seen);
    }
    return paths;
  }
  // won't be called without `.config.referenceTracking` so internal guard avoided
  link(target, parent, key, typecheck = true, es) {
    if (!canHandle(target, this.config, typecheck)) return false;
    es = (this.lineage ??= /* @__PURE__ */ new WeakMap()).get(target) ?? (this.lineage.set(target, es = []), es);
    for (let i = 0, len = es.length; i < len; i += 2) if (Object.is(es[i], parent) && es[i + 1] === key) return true;
    return es.push(parent, key), true;
  }
  unlink(target, parent, key) {
    if (!canHandle(target, this.config)) return;
    const es = (this.lineage ??= /* @__PURE__ */ new WeakMap()).get(target);
    if (es) {
      for (let i = 0, len = es.length; i < len; i += 2) if (Object.is(es[i], parent) && es[i + 1] === key) return void es.splice(i, 2);
    }
  }
  stamp(target, typecheck = true, seen = /* @__PURE__ */ new WeakSet()) {
    if (typecheck && "object" !== typeof target) return;
    target = target[RAW] || target;
    if (seen.has(target)) return;
    seen.add(target);
    target[VERSION] = (target[VERSION] || 0) + 1;
    const es = (this.lineage ??= /* @__PURE__ */ new WeakMap()).get(target);
    if (es) for (let i = 0, len = es.length; i < len; i += 2) this.stamp(es[i], false, seen);
  }
  mediate(path, payload, type, cords) {
    let terminated = false, value = payload.target.value;
    const isGet = type === "get", isSet = type === "set", mediators = isGet ? this.getters : isSet ? this.setters : this.deleters;
    for (let i = !isGet ? 0 : cords.length - 1, len = !isGet ? cords.length : -1; i !== len; i += !isGet ? 1 : -1) {
      const cord = cords[i], response = isGet ? cord.cb(value, payload) : isSet ? cord.cb(value, terminated, payload) : cord.cb(terminated, payload);
      if (isGet || !(terminated ||= payload.terminated = response === TERMINATOR)) value = response;
      if (cord.once) cords.splice((len--, i--), 1), !cords.length && mediators.delete(path);
    }
    return value;
  }
  notify(path, payload) {
    if (this.watchers) {
      const wildcords = this.watchers.get("*"), cords = this.watchers.get(path);
      if (cords)
        for (let i = 0, len = cords.length; i < len; i++) {
          const cord = cords[i];
          cord.cb(payload.target.value, payload);
          if (cord.once) cords.splice((len--, i--), 1), !cords.length && this.watchers.delete(path);
        }
      if (wildcords)
        for (let i = 0, len = wildcords.length; i < len; i++) {
          const wildcord = wildcords[i];
          wildcord.cb(payload.target.value, payload);
          if (wildcord.once) wildcords.splice((len--, i--), 1), !wildcords.length && this.watchers.delete("*");
        }
    }
    this.listeners && this.schedule(path, payload);
  }
  schedule(path, payload) {
    this.batch ??= /* @__PURE__ */ new Map();
    this.batch.set(path, payload), !this.isBatching && this.initBatching();
  }
  initBatching() {
    this.isBatching = true, this.config.batchingFunction(() => this.flush());
  }
  flush() {
    this.isBatching = false, this.batch && this.tick(this.batch.keys());
    if (this.queue?.size) for (const task of this.queue) task(), this.queue.delete(task);
  }
  wave(path, payload) {
    const e = new ReactorEvent(payload, this), chain = getTrailRecords(this.core, path);
    e.eventPhase = ReactorEvent.CAPTURING_PHASE;
    for (let i = 0; i <= chain.length - 2; i++) {
      if (e.propagationStopped) break;
      this.fire(chain[i], e, true);
    }
    if (e.propagationStopped) return;
    e.eventPhase = ReactorEvent.AT_TARGET;
    this.fire(chain[chain.length - 1], e, true);
    !e.immediatePropagationStopped && this.fire(chain[chain.length - 1], e, false);
    if (!e.bubbles) return;
    e.eventPhase = ReactorEvent.BUBBLING_PHASE;
    for (let i = chain.length - 2; i >= 0; i--) {
      if (e.propagationStopped) break;
      this.fire(chain[i], e, false);
    }
  }
  fire([path, object, value], e, isCapture, cords = this.listeners.get(path)) {
    if (!cords) return;
    e.type = path !== e.target.path ? "update" : e.staticType;
    e.currentTarget = { path, value, oldValue: e.type !== "update" ? e.target.oldValue : void 0, key: e.type !== "update" ? path : path.slice(path.lastIndexOf(".") + 1) || "", hadKey: e.type !== "update" ? e.target.hadKey : true, object };
    for (let i = 0, len = cords.length, tDepth; i < len; i++) {
      const cord = cords[i];
      if (e.immediatePropagationStopped) break;
      if (cord.capture !== isCapture) continue;
      if (cord.depth !== void 0) {
        tDepth ??= this.getDepth(e.target.path);
        if (tDepth > cord.lDepth + cord.depth) continue;
      }
      cord.cb(e);
      if (cord.once) cords.splice((len--, i--), 1), !cords.length && this.listeners.delete(path);
    }
  }
  /**
   * Flushes queued listener payloads.
   * @param paths Optional path (or paths) to flush.
   * @example
   * rtr.tick(); // to flush all paths in batch or pass "*" wildcard
   * @example
   * rtr.tick("user.profile.name");
   */
  tick(paths) {
    if (!paths || paths === "*") return this.flush();
    if ("string" === typeof paths) {
      const payload = this.batch?.get(paths);
      payload && (this.batch.delete(paths), this.wave(paths, payload));
    } else
      for (const path of paths) {
        const payload = this.batch.get(path);
        payload && (this.batch.delete(path), this.wave(path, payload));
      }
  }
  /**
   * Queues a task to run after the current flush cycle.
   * @param task Task callback.
   * @example
   * const task = () => console.log("after flush");
   * rtr.stall(task);
   */
  stall(task) {
    (this.queue ??= /* @__PURE__ */ new Set()).add(task), !this.isBatching && this.initBatching();
  }
  /**
   * Removes a queued post-flush task.
   * @param task Task callback.
   * @returns `undefined` when no queue, `false` when queue exist but callback is not found, `true` when removed.
   */
  nostall(task) {
    return this.queue?.delete(task);
  }
  getDepth(path, depth = !path ? 0 : 1) {
    for (let i = 0, len = path.length; i < len; i++) if (path.charCodeAt(i) === 46) depth++;
    return depth;
  }
  getContext(path) {
    const last = path.lastIndexOf("."), value = getAny(this.core, path), object = last === -1 ? this.core : getAny(this.core, path.slice(0, last));
    return { path, value, key: path.slice(last + 1) || "", hadKey: true, object };
  }
  bindSignal(cord, sig) {
    if (sig) sig.aborted ? cord.clup() : sig.addEventListener("abort", cord.clup, { once: true });
    return cord.sclup = !sig || sig.aborted ? NOOP : () => sig.removeEventListener("abort", cord.clup), cord.clup;
  }
  cloned(target, raw, seen = /* @__PURE__ */ new WeakMap()) {
    if (!target || "object" !== typeof target) return target;
    const obj = target[RAW] || target, cloned = seen.get(obj);
    if (cloned) return cloned;
    if (!canHandle(obj, this.config, false)) return obj;
    const version = obj[VERSION] || 0, cached = !raw && this.config.smartCloning && (this.snapCache ??= /* @__PURE__ */ new WeakMap()).get(obj);
    if (cached && obj[SSVERSION] === version) return cached;
    const clone = !raw ? this.config.preserveContext ? Object.create(Object.getPrototypeOf(obj)) : Array.isArray(obj) ? [] : {} : obj;
    seen.set(obj, clone);
    const keys = this.config.preserveContext ? Reflect.ownKeys(obj) : Object.keys(obj);
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i];
      try {
        clone[key] = this.cloned(obj[key], raw, seen);
      } catch (e) {
        if (e instanceof RangeError) throw e;
      }
    }
    if (!raw && this.config.smartCloning) this.snapCache.set(obj, clone), obj[SSVERSION] = version;
    return clone;
  }
  syncAdd(key, path, cb, opts, onImmediate = NOOP) {
    const { lazy = false, once = false, signal, immediate = false } = parseEvtOpts(opts, EVT_OPTS.MEDIATOR), store = this[`${key}${key.endsWith("t") ? "t" : ""}ers`] ??= /* @__PURE__ */ new Map();
    let cords = store.get(path), cord;
    if (cords)
      for (let i = 0, len = cords.length; i < len; i++) {
        const excord = cords[i];
        if (Object.is(excord.cb, cb)) {
          cord = excord;
          break;
        }
      }
    if (cord) return cord.clup;
    let task;
    cord = { cb, once, clup: () => (lazy && this.nostall(task), this[`no${key}`](path, cb)) };
    immediate && onImmediate(immediate);
    task = () => (cords ?? (store.set(path, cords = []), cords)).push(cord);
    lazy ? this.stall(task) : task();
    return this.bindSignal(cord, signal);
  }
  syncDrop(store, path, cb) {
    const cords = store?.get(path);
    if (!cords) return void 0;
    for (let i = 0, len = cords.length; i < len; i++) {
      const cord = cords[i];
      if (Object.is(cord.cb, cb)) return cord.sclup(), cords.splice((len--, i--), 1), !cords.length && store.delete(path), true;
    }
    return false;
  }
  /**
   * Registers a get mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback.
   * @param options Sync options.
   * @returns Cleanup function.
   * @example
   * const cleanup = rtr.get("user.name", (value) => String(value).trim());
   */
  get(path, callback, options) {
    return this.syncAdd("get", path, callback, options, (imm) => (imm !== "auto" || inAny(this.core, path)) && getAny(this.core, path));
  }
  /** Registers a get mediator for a path that only triggers once. */
  gonce(path, callback, options) {
    return this.get(path, callback, { ...parseEvtOpts(options, EVT_OPTS.MEDIATOR), once: true });
  }
  /**
   * Removes a get mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback to remove.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   */
  noget(path, callback) {
    return this.syncDrop(this.getters, path, callback);
  }
  /**
   * Registers a set mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback.
   * @param options Sync options.
   * @returns Cleanup function.
   * @example
   * rtr.set("user.name", (value) => String(value).trim());
   */
  set(path, callback, options) {
    return this.syncAdd("set", path, callback, options, (imm) => (imm !== "auto" || inAny(this.core, path)) && setAny(this.core, path, getAny(this.core, path)));
  }
  /** Registers a set mediator for a path that only triggers once. */
  sonce(path, callback, options) {
    return this.set(path, callback, Object.assign(parseEvtOpts(options, EVT_OPTS.MEDIATOR), { once: true }));
  }
  /**
   * Removes a set mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback to remove.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   */
  noset(path, callback) {
    return this.syncDrop(this.setters, path, callback);
  }
  /**
   * Registers a delete mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback.
   * @param options Sync options.
   * @returns Cleanup function.
   * @example
   * rtr.delete("cache.temp", () => TERMINATOR);
   */
  delete(path, callback, options) {
    return this.syncAdd("delete", path, callback, options, (imm) => (imm !== "auto" || inAny(this.core, path)) && deleteAny(this.core, path));
  }
  /** Registers a delete mediator for a path that only triggers once. */
  donce(path, callback, options) {
    return this.delete(path, callback, Object.assign(parseEvtOpts(options, EVT_OPTS.MEDIATOR), { once: true }));
  }
  /**
   * Removes a delete mediator for a path.
   * @param path Path or wildcard path.
   * @param callback Mediator callback to remove.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   */
  nodelete(path, callback) {
    return this.syncDrop(this.deleters, path, callback);
  }
  /**
   * Registers a watcher for a path.
   * Watch callbacks run synchronously with the operation, use leaf paths for reliability as it sees exact sets; no bubbling here.
   * @param path Path or wildcard path.
   * @param callback Watch callback.
   * @param options Sync options.
   * @returns Cleanup function.
   * @example
   * const cleanup = rtr.watch("user.name", (value) => console.log(value));
   */
  watch(path, callback, options) {
    return this.syncAdd("watch", path, callback, options, (imm) => imm !== "auto" && inAny(this.core, path) && ((target) => callback(target.value, { type: "init", target, currentTarget: target, root: this.core, rejectable: false }))(this.getContext(path)));
  }
  /** Registers a watcher for a path that only triggers once. */
  wonce(path, callback, options) {
    return this.watch(path, callback, Object.assign(parseEvtOpts(options, EVT_OPTS.MEDIATOR), { once: true }));
  }
  /**
   * Removes a watcher for a path.
   * @param path Path or wildcard path.
   * @param callback Watch callback to remove.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   */
  nowatch(path, callback) {
    return this.syncDrop(this.watchers, path, callback);
  }
  /**
   * Registers an event listener for a path.
   * `on` listeners are batched and notified asynchronously by default e.g. `queueMicrotask()`.
   * @param path Path or wildcard path.
   * @param callback Listener callback.
   * @param options Listener options.
   * @returns Cleanup function.
   * @example
   * const cleanup = rtr.on("user.name", (e) => console.log(e.type, e.path));
   */
  on(path, callback, options) {
    this.listeners ??= /* @__PURE__ */ new Map();
    const { capture = false, once = false, signal, immediate = false, depth } = parseEvtOpts(options, EVT_OPTS.LISTENER);
    let cords = this.listeners.get(path), cord;
    if (cords)
      for (let i = 0, len = cords.length; i < len; i++) {
        const excord = cords[i];
        if (Object.is(excord.cb, callback) && capture === excord.capture) {
          cord = excord;
          break;
        }
      }
    if (cord) return cord.clup;
    cord = { cb: callback, capture, depth, once, clup: () => this.off(path, callback, options), lDepth: depth !== void 0 ? this.getDepth(path) : depth };
    if (immediate && (immediate !== "auto" || inAny(this.core, path))) {
      const target = this.getContext(path);
      callback(new ReactorEvent({ type: "init", target, currentTarget: target, root: this.core, rejectable: false }, this));
    }
    (cords ?? (this.listeners.set(path, cords = []), cords)).push(cord);
    return this.bindSignal(cord, signal);
  }
  /** Registers an event listener for a path that only triggers once. */
  once(path, callback, options) {
    return this.on(path, callback, Object.assign(parseEvtOpts(options, EVT_OPTS.LISTENER), { once: true }));
  }
  /**
   * Removes an event listener for a path.
   * @param path Path or wildcard path.
   * @param callback Listener callback to remove.
   * @param options Listener options used during registration.
   * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
   * @example
   * const cb = (e: REvent<T>) => console.log(e.path);
   * rtr.on("user.name", cb);
   * rtr.off("user.name", cb);
   */
  off(path, callback, options) {
    const cords = this.listeners?.get(path);
    if (!cords) return void 0;
    const { capture } = parseEvtOpts(options, EVT_OPTS.LISTENER);
    for (let i = 0, len = cords.length; i < len; i++) {
      const cord = cords[i];
      if (Object.is(cord.cb, callback) && cord.capture === capture) return cord.sclup(), cords.splice((len--, i--), 1), !cords.length && this.listeners.delete(path), true;
    }
    return false;
  }
  snapshot(raw = !this.config.smartCloning, branch) {
    return this.cloned(arguments.length < 2 ? this.core : branch, raw);
  }
  /**
   * Installs a module instance.
   * @param target Module instance.
   * @param id Optional identification tag for this instance in the module.
   * @returns Current `Reactor` instance for fluent chaining.
   */
  use(target, id) {
    return (this.modules ??= /* @__PURE__ */ new Set()).add(target.setup(this, id)), this;
  }
  /** Resets this reactor instance to its initial state. */
  reset() {
    this.getters?.clear(), this.setters?.clear(), this.deleters?.clear(), this.watchers?.clear(), this.listeners?.clear();
    this.batch?.clear(), this.queue?.clear(), this.isBatching = false;
  }
  destroy() {
    if (this.modules) for (const mdle of this.modules) mdle.destroy();
    this.reset(), nuke(this);
  }
  get canLog() {
    return this.log !== NOOP;
  }
  set canLog(value) {
    this.log = value ? RTR_LOG : NOOP;
  }
  get canLineageTrace() {
    return this.config.lineageTracing && this.config.referenceTracking;
  }
  get canSmartClone() {
    return this.config.smartCloning && this.config.referenceTracking;
  }
};

// src/ts/core/mixins.ts
var methods = ["tick", "stall", "nostall", "get", "gonce", "noget", "set", "sonce", "noset", "delete", "donce", "nodelete", "watch", "wonce", "nowatch", "on", "once", "off", "snapshot", "use", "reset", "destroy"];
function reactive(target, build, preferences = NIL) {
  if ("__Reactor__" in target) return target;
  const descriptors = {}, rtr = getReactor(target, true, build), locks = { enumerable: false, configurable: true, writable: false }, hasAffix = !!(preferences.prefix || preferences.suffix);
  for (let i = 0, len = methods.length; i < len; i++) {
    let key = methods[i];
    if (hasAffix) (preferences.whitelist?.includes(key) ?? true) && (key = `${preferences.prefix || ""}${key}${preferences.suffix || ""}`);
    else if (preferences.whitelist?.includes(key)) continue;
    descriptors[key] = { value: rtr[methods[i]].bind(rtr), ...locks };
  }
  descriptors["__Reactor__"] = { value: rtr, ...locks };
  return Object.defineProperties(rtr.core, descriptors), rtr.core;
}
function intent(target) {
  return getRaw(target)[REJECTABLE] = true, target;
}
function state(target) {
  return delete getRaw(target)[REJECTABLE], target;
}
function isIntent(target = NIL) {
  return !!getRaw(target)[REJECTABLE];
}
function inert(target) {
  return getRaw(target)[INERTIA] = true, target;
}
function live(target) {
  return delete getRaw(target)[INERTIA], target;
}
function isInert(target = NIL) {
  return !!getRaw(target)[INERTIA];
}
function volatile(target) {
  return getRaw(target)[INDIFFABLE] = true, target;
}
function stable(target) {
  return delete getRaw(target)[INDIFFABLE], target;
}
function isVolatile(target = NIL) {
  return !!getRaw(target)[INDIFFABLE];
}
function getReactor(target, create = false, build) {
  return (target instanceof Reactor ? target : target.__Reactor__) || (create ? new Reactor(target, build) : void 0);
}
function getRaw(target = NIL) {
  return target[RAW] || target;
}
function getVersion(target = NIL) {
  return getRaw(target)[VERSION] || 0;
}
function getSnapshotVersion(target = NIL) {
  return getRaw(target)[SSVERSION] || 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CTX,
  EVT_OPTS,
  INDIFFABLE,
  INERTIA,
  NIL,
  NOOP,
  RAW,
  REJECTABLE,
  RTR_BATCH,
  RTR_LOG,
  Reactor,
  ReactorEvent,
  SSVERSION,
  TERMINATOR,
  VERSION,
  getRaw,
  getSnapshotVersion,
  getVersion,
  inert,
  intent,
  isInert,
  isIntent,
  isVolatile,
  live,
  methods,
  reactive,
  stable,
  state,
  volatile
});
