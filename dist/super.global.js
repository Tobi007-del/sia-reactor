"use strict";
var sia = (() => {
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

  // src/ts/super.ts
  var super_exports = {};
  __export(super_exports, {
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
    adapters: () => adapters,
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
    modules: () => modules_exports,
    reactive: () => reactive,
    stable: () => stable,
    state: () => state,
    utils: () => utils_exports,
    volatile: () => volatile
  });

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
    const keys2 = key.split(separator);
    let currObj = source;
    for (let i = 0, len = keys2.length; i < len; i++) {
      const key2 = keyFunc ? keyFunc(keys2[i]) : keys2[i], match = key2.includes("[") && key2.match(arrRegex);
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
    const keys2 = key.split(separator);
    for (let currObj = target, i = 0, len = keys2.length; i < len; i++) {
      const key2 = keyFunc ? keyFunc(keys2[i]) : keys2[i], match = key2.includes("[") && key2.match(arrRegex);
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
      const keys3 = Object.keys(target);
      for (let i = 0, len = keys3.length; i < len; i++) delete target[keys3[i]];
      return;
    }
    if (!key.includes(separator)) return void delete target[keyFunc ? keyFunc(key) : key];
    const keys2 = key.split(separator);
    for (let currObj = target, i = 0, len = keys2.length; i < len; i++) {
      const key2 = keyFunc ? keyFunc(keys2[i]) : keys2[i], match = key2.includes("[") && key2.match(arrRegex);
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
    const keys2 = key.split(separator);
    for (let currObj = source, i = 0, len = keys2.length; i < len; i++) {
      const key2 = keyFunc ? keyFunc(keys2[i]) : keys2[i], match = key2.includes("[") && key2.match(arrRegex);
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
    const result = {}, keys2 = Object.keys(obj);
    for (let i = 0, len = keys2.length; i < len; i++) {
      const key = keys2[i], val = obj[key];
      key === "*" || key.includes(separator) ? setAny(result, key, parseAnyObj(val, separator, keyFunc, seen), separator, keyFunc) : result[key] = isObj(val) ? parseAnyObj(val, separator, keyFunc, seen) : val;
    }
    return result;
  }
  function parseEvtOpts(options, opts, boolOpt = opts[0], result = {}) {
    return Object.assign(result, "boolean" === typeof options ? { [boolOpt]: options } : options), result;
  }
  function fanout(a, b, c, d) {
    const isEvPd = !!a?.target, isPath = !isEvPd && "string" === typeof b, [state2, path, olds, news, opts, type] = isEvPd ? [a.root, a.currentTarget.path, a.currentTarget.oldValue, a.currentTarget.value, b || NIL, a.type] : isPath ? [a, b, getAny(a, b), c, d || NIL, void 0] : [void 0, void 0, a, b, c || NIL, void 0], target = isEvPd ? getAny(a.root, a.currentTarget.path) : isPath ? getAny(state2, path) : olds;
    if (isEvPd && type !== "set" && type !== "delete" || !target || !canHandle(news, opts)) return;
    const prev = CTX.isCascading;
    CTX.isCascading = isEvPd;
    try {
      const walk = (target2, obj, depth = isEvPd ? 1 : Infinity, keys2 = Object.keys(obj)) => {
        for (let i = 0, len = keys2.length; i < len; i++) {
          const key = keys2[i], val = obj[key];
          try {
            if ((opts.atomic ?? true) && Array.isArray(val)) target2[key] = val, target2[key].length = target2[key].length;
            else depth > 1 && canHandle(val, opts) ? walk(target2[key] ||= {}, val, depth - 1) : target2[key] = val;
          } catch (e) {
            if (e instanceof RangeError) throw e;
          }
        }
      };
      if ((opts.atomic ?? true) && Array.isArray(news) && isPath) setAny(state2, path, news), getAny(state2, path).length = news.length;
      else walk(target, opts.merge ? mergeObjs(olds, news, opts) : news, opts.depth === true ? Infinity : opts.depth);
    } finally {
      CTX.isCascading = prev;
    }
  }
  var fanoutOptsArr = ["merge", "depth", "atomic"];
  function mergeObjs(o1, o2, config, pojocheck = true) {
    if (pojocheck && (!isPOJO(o1 || NIL, config) || !isPOJO(o2 || NIL, config))) return o2;
    const merged = { ...o1 ||= {}, ...o2 ||= {} }, keys2 = Object.keys(merged);
    for (let i = 0, len = keys2.length; i < len; i++) {
      const key = keys2[i], o1C = o1[key], o2C = o2[key];
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
    const keys2 = config.preserveContext ? Reflect.ownKeys(obj) : Object.keys(obj);
    for (let i = 0, len = keys2.length; i < len; i++) {
      const key = keys2[i];
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
      const keys2 = Object.getOwnPropertyNames(proto);
      for (let i = 0, len = keys2.length; i < len; i++) {
        const key = keys2[i];
        if (key === "constructor") continue;
        const desc = Object.getOwnPropertyDescriptor(proto, keys2[i]);
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
      const keys2 = this.config.preserveContext ? Reflect.ownKeys(obj) : Object.keys(obj);
      for (let i = 0, len = keys2.length; i < len; i++) {
        const key = keys2[i];
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

  // src/ts/modules.ts
  var modules_exports = {};
  __export(modules_exports, {
    AsyncStorageAdapter: () => AsyncStorageAdapter,
    BaseReactorModule: () => BaseReactorModule,
    BaseStorageAdapter: () => BaseStorageAdapter,
    COOKIE_ADAPTER_BUILD: () => COOKIE_ADAPTER_BUILD,
    CookieAdapter: () => CookieAdapter,
    INDEXED_DB_ADAPTER_BUILD: () => INDEXED_DB_ADAPTER_BUILD,
    IndexedDBAdapter: () => IndexedDBAdapter,
    LocalStorageAdapter: () => LocalStorageAdapter,
    MemoryAdapter: () => MemoryAdapter,
    PERSIST_MODULE_BUILD: () => PERSIST_MODULE_BUILD,
    PersistModule: () => PersistModule,
    SessionStorageAdapter: () => SessionStorageAdapter,
    StorageAdapter: () => StorageAdapter,
    TIME_TRAVEL_MODULE_BUILD: () => TIME_TRAVEL_MODULE_BUILD,
    TimeTravelModule: () => TimeTravelModule
  });

  // src/ts/modules/base.ts
  var wpArr = ["*"];
  var BaseReactorModule = class {
    static moduleName;
    get name() {
      return this.constructor.moduleName;
    }
    ac = new AbortController();
    signal = this.ac.signal;
    rtrs = /* @__PURE__ */ new Map();
    rids = /* @__PURE__ */ new WeakMap();
    // for quick 0(1) lookups over iteration
    wired = false;
    /** The reactive configuration object for the module, manipulate to change behaviour. */
    config;
    /** The reactive state object for the module, watch to see exposed lifecycle changes. */
    state;
    constructor(config, rtr, state2) {
      guardAllMethods(this, this.guard);
      this.config = isObj(config) ? reactive(config) : config;
      this.state = isObj(state2) ? reactive(state2) : state2;
      rtr && this.attach(rtr);
    }
    /**
     * Connect to a `Reactor` instance, allows managing multiple reactors if needed.
     * @param target `Reactor` instance or `reactive()` object to connect to.
     * @param id Optional custom id for the reactor, prefer over default implicit index id when managing multiple reactors, supports paths to merge into a single tree.
     * @returns Current `ReactorModule` instance for fluent chaining.
     * @example
     * const mod = new MyModule().attach(state1).attach(state2); // implicit index-based ids by default, add a .setup() or `Reactor.use()` when ready for init.
     * @example
     * const persist = new PersistModule(config).attach(sessState, "session").attach(adminState, "session.admin"); // don't use "*", causes de-serialization issues.
     */
    attach(target, id = this.rtrs.size) {
      const rtr = getReactor(target);
      if (!rtr || this.rtrs.has(id)) return this;
      return this.rids.set((this.rtrs.set(id, rtr), rtr), id), this.onAttach(rtr, id), this;
    }
    onAttach(_rtr, _rid) {
    }
    /**
     * Entry point called to initialize module wiring, calls `.attach(target, id)` first, `Reactor.use()` calls this internally.
     * Should run as last in `.attach()` chain or after all desired reactors if using multiple; so wiring is done safely after.
     * @param target `Reactor` instance or `reactive()` object to connect to.
     * @param id Optional id for the reactor, prefer over default implicit index id when managing multiple reactors.
     * @returns Current `ReactorModule` instance for fluent chaining.
     * @example
     * const mod = new MyModule().attach(state1).setup(state2); // if using multiple, this should run last; with same params as `.attach()` for a shorter chain
     */
    setup(target, id) {
      return this.attach(target, id), !this.wired && (this.wire(), this.wired = true), this;
    }
    destroy() {
      this.ac.abort();
      this.onDestroy?.();
    }
    /**
     * Wraps a function with module-scoped error logging.
     * Use this when creating functions dynamically (for example, before attaching an anonymous listener on the fly).
     * @example
     * window.addEventListener("resize", this.guard(() => this.syncLayout(true)), { signal: this.signal });
     */
    guard = (fn) => {
      return guardMethod(fn, (e) => this.rtrs.values().next().value?.log(`[Reactor "${this.name}" Module] Error: ${e}`));
    };
    // `()=>{}`: needs to be bounded even before initialization
    /**
     * Path resolution utility for modules, provides automatic reactor id resolution for multi-reactor setups.
     * @param paths Paths to filter by, supports same formats as `ModulePaths`, will be resolved with the module's reactor id if applicable.
     * @param target Reactor or reactor id to resolve paths for when using per-reactor path lists`.
     * @returns Resolved paths array, defaults to `["*"]` if no paths are found using search criteria.
     */
    getPaths(paths, target) {
      const rid = "object" === typeof target ? this.rids.get(target) : target;
      return (paths && (Array.isArray(paths) ? paths : paths[String(rid)])) ?? wpArr;
    }
  };

  // src/ts/utils/store.ts
  var BaseStorageAdapter = class {
    name = "StorageAdapter";
    config;
    warn = (act = "", mssg = "Support issue or Private Mode", key = "", store = "") => this.config.debug && console.warn(`[${this.constructor.name} \`${act}\`] Failed${key ? `for ${key}` : ""} ${store ? ` on "${store}"` : ""} ${this.config.dbName ? ` at ${this.config.dbName}` : ""} (${mssg})`);
    constructor(config) {
      this.config = { debug: false, ...config };
    }
  };
  var StorageAdapter = class extends BaseStorageAdapter {
    name = "SyncStorageAdapter";
  };
  var AsyncStorageAdapter = class extends BaseStorageAdapter {
    name = "AsyncStorageAdapter";
  };
  var LocalStorageAdapter = class extends StorageAdapter {
    name = "LocalStorage";
    /**
     * Reads and parses a value from localStorage.
     * @param key Storage key.
     * @returns Parsed value, or `undefined` when missing/unreadable.
     */
    get(key, reviver = this.config.reviver) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v, reviver) : void 0;
      } catch {
        return void 0;
      }
    }
    /**
     * Serializes and writes a value to localStorage.
     * @param key Storage key.
     * @param value Value to serialize.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key, value, replacer = this.config.replacer) {
      try {
        return localStorage.setItem(key, JSON.stringify(value, replacer)), true;
      } catch (e) {
        return this.warn("setItem", void 0, key), false;
      }
    }
    /**
     * Removes a single key from localStorage.
     * @param key Storage key.
     * @returns `true` when removal succeeds, else `false`.
     */
    remove(key) {
      try {
        return localStorage.removeItem(key), true;
      } catch (e) {
        return this.warn("removeItem", void 0, key), false;
      }
    }
    /**
     * Clears all localStorage entries for the current origin.
     * @returns `true` when clear succeeds, else `false`.
     */
    clear() {
      try {
        return localStorage.clear(), true;
      } catch (e) {
        return this.warn("clear", void 0), false;
      }
    }
  };
  var SessionStorageAdapter = class extends StorageAdapter {
    name = "SessionStorage";
    /**
     * Reads and parses a value from sessionStorage.
     * @param key Storage key.
     * @returns Parsed value, or `undefined` when missing/unreadable.
     */
    get(key, reviver = this.config.reviver) {
      try {
        const v = sessionStorage.getItem(key);
        return v ? JSON.parse(v, reviver) : void 0;
      } catch {
        return void 0;
      }
    }
    /**
     * Serializes and writes a value to sessionStorage.
     * @param key Storage key.
     * @param value Value to serialize.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key, value, replacer = this.config.replacer) {
      try {
        return sessionStorage.setItem(key, JSON.stringify(value, replacer)), true;
      } catch (e) {
        return this.warn("setItem", void 0, key), false;
      }
    }
    /**
     * Removes a single key from sessionStorage.
     * @param key Storage key.
     * @returns `true` when removal succeeds, else `false`.
     */
    remove(key) {
      try {
        return sessionStorage.removeItem(key), true;
      } catch (e) {
        return this.warn("removeItem", void 0, key), false;
      }
    }
    /**
     * Clears all sessionStorage entries for the current tab session.
     * @returns `true` when clear succeeds, else `false`.
     */
    clear() {
      try {
        return sessionStorage.clear(), true;
      } catch (e) {
        return this.warn("clear", void 0), false;
      }
    }
  };
  var MemoryAdapter = class extends StorageAdapter {
    name = "Memory";
    constructor(build) {
      super({ store: /* @__PURE__ */ new Map(), ...build });
    }
    /**
     * Reads and parses a value from memory storage.
     * @param key Storage key.
     * @returns Parsed value, or `undefined` when missing/unreadable.
     */
    get(key, reviver = this.config.reviver) {
      try {
        const v = this.config.store.get(key);
        return v ? JSON.parse(v, reviver) : void 0;
      } catch {
        return void 0;
      }
    }
    /**
     * Serializes and writes a value to memory storage.
     * @param key Storage key.
     * @param value Value to serialize.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key, value, replacer = this.config.replacer) {
      try {
        return this.config.store.set(key, JSON.stringify(value, replacer)), true;
      } catch (e) {
        return this.warn("set", void 0, key), false;
      }
    }
    /**
     * Removes a single key from memory storage.
     * @param key Storage key.
     * @returns `true` when removal succeeds, else `false`.
     */
    remove(key) {
      try {
        return this.config.store.delete(key), true;
      } catch (e) {
        return this.warn("remove", void 0, key), false;
      }
    }
    /**
     * Clears all entries from memory storage.
     * @returns `true` when clear succeeds, else `false`.
     */
    clear() {
      try {
        return this.config.store.clear(), true;
      } catch (e) {
        return this.warn("clear", void 0), false;
      }
    }
  };
  var CookieAdapter = class extends StorageAdapter {
    name = "Cookie";
    deets = (opts = NIL, _d = opts.domain ?? this.config.domain, _m = opts.maxAge ?? this.config.maxAge, _e = opts.expires ?? this.config.expires) => `Path=${opts.path ?? this.config.path}; SameSite=${opts.sameSite ?? this.config.sameSite}${_d ? `; Domain=${_d}` : ""}${opts.secure ?? this.config.secure ? "; Secure" : ""}${_m !== void 0 ? `; Max-Age=${_m}` : ""}${_e !== void 0 ? `; Expires=${_e instanceof Date ? _e.toUTCString() : _e}` : ""}`;
    constructor(build) {
      super({ secure: "undefined" !== typeof window && location.protocol === "https:", ...COOKIE_ADAPTER_BUILD, ...build });
    }
    /**
     * Reads and parses a cookie visible to the current page scope.
     * @param key Cookie key.
     * @returns Parsed value, or `undefined` when missing/unreadable.
     */
    get(key, reviver = this.config.reviver) {
      try {
        const k = encodeURIComponent(key) + "=";
        for (const pair of document.cookie ? document.cookie.split("; ") : []) {
          if (!pair.startsWith(k)) continue;
          return JSON.parse(decodeURIComponent(pair.slice(k.length)), reviver);
        }
        return void 0;
      } catch {
        return void 0;
      }
    }
    /**
     * Writes a cookie with optional per-call scope/lifetime overrides.
     * @param key Cookie key.
     * @param value Value to serialize.
     * @param opts Optional per-call cookie options.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key, value, opts, replacer = this.config.replacer) {
      try {
        return document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value, replacer))}; ${this.deets(opts)}`, true;
      } catch {
        return this.warn("set", void 0, key), false;
      }
    }
    /**
     * Removes a cookie key using matching scope attributes.
     * @param key Cookie key.
     * @param opts Optional per-call scope overrides.
     * @returns `true` when removal succeeds, else `false`.
     */
    remove(key, opts) {
      try {
        return document.cookie = `${encodeURIComponent(key)}=; ${this.deets({ ...opts, maxAge: 0, expires: /* @__PURE__ */ new Date(0) })}`, true;
      } catch {
        return this.warn("remove", void 0, key), false;
      }
    }
    /**
     * Attempts to remove all visible cookie keys for the given scope.
     * @param opts Optional per-call scope overrides.
     * @returns `true` when clear succeeds, else `false`.
     */
    clear(opts) {
      try {
        for (const pair of document.cookie ? document.cookie.split("; ") : []) {
          const idx = pair.indexOf("=");
          document.cookie = `${idx === -1 ? pair : pair.slice(0, idx)}=; ${this.deets({ ...opts, maxAge: 0, expires: /* @__PURE__ */ new Date(0) })}`;
        }
        return true;
      } catch {
        return this.warn("clear"), false;
      }
    }
  };
  var IndexedDBAdapter = class extends AsyncStorageAdapter {
    name = "IndexedDB";
    db;
    constructor(build) {
      super({ ...INDEXED_DB_ADAPTER_BUILD, ...build });
    }
    /**
     * Returns a connected IndexedDB instance, opening it when needed.
     * @returns Connected database handle.
     */
    async idb() {
      const idb = this.config.onidb();
      if (idb || this.db) return Promise.resolve(idb || this.db);
      return new Promise((res, rej) => {
        const req = indexedDB.open(this.config.dbName, this.config.version);
        req.onupgradeneeded = (e) => (this.config.onupgradeneeded(req.result, e), this.config.stores.forEach((s) => !req.result.objectStoreNames.contains(s) && req.result.createObjectStore(s)));
        req.onsuccess = (e) => (this.config.onsuccess(req.result, e), req.result.onversionchange = (e2) => (this.config.onversionchange(req.result, e2), this.warn("update", "Updated in another tab"), req.result.close()), res(this.db = req.result));
        req.onerror = (e) => (this.config.onerror(req.error, e), this.warn("open", "Something went wrong"), rej(req.error));
        req.onblocked = (e) => (this.config.onblocked(e), this.warn("open", "Close other tabs for updates"));
      });
    }
    /**
     * Reads a value by key from an object store.
     * @param key Record key.
     * @param store Optional object-store override.
     * @returns Stored value, or `undefined` when missing/unreadable.
     */
    async get(key, store = this.config.stores[0], options = this.config) {
      try {
        const req = (await this.idb()).transaction(store, "readonly", options).objectStore(store).get(key);
        return new Promise((res) => req.onsuccess = () => res(req.result));
      } catch {
        return this.warn("get", void 0, store), void 0;
      }
    }
    /**
     * Writes a value by key into an object store.
     * @param key Record key.
     * @param value Value to store.
     * @param store Optional object-store override.
     * @returns `true` when write succeeds, else `false`.
     */
    async set(key, value, store = this.config.stores[0], options = this.config) {
      try {
        const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).put(value, key);
        return new Promise((res) => req.onsuccess = () => res(true));
      } catch (e) {
        return this.warn("put", void 0, store), false;
      }
    }
    /**
     * Deletes a value by key from an object store.
     * @param key Record key.
     * @param store Optional object-store override.
     * @returns `true` when delete succeeds, else `false`.
     */
    async remove(key, store = this.config.stores[0], options = this.config) {
      try {
        const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).delete(key);
        return new Promise((res) => req.onsuccess = () => res(true));
      } catch (e) {
        return this.warn("delete", void 0, store), false;
      }
    }
    /**
     * Clears one or more object stores.
     * @param stores Store name or list of store names to clear.
     * @returns `true` when all clears succeed, else `false`.
     */
    async clear(stores = this.config.stores, options = this.config) {
      let success = true;
      for (const store of Array.isArray(stores) ? stores : [stores])
        try {
          const req = (await this.idb()).transaction(store, "readwrite", options).objectStore(store).clear();
          await new Promise((res) => req.onsuccess = () => res(true));
        } catch (e) {
          this.warn("clear", void 0, store), success = false;
        }
      return success;
    }
  };
  var COOKIE_ADAPTER_BUILD = { path: "/", sameSite: "Lax", domain: void 0, debug: false };
  var INDEXED_DB_ADAPTER_BUILD = { dbName: "REACTOR_IDB", stores: ["VAULT"], version: 1, onidb: NOOP, onupgradeneeded: NOOP, onversionchange: NOOP, onsuccess: NOOP, onerror: NOOP, onblocked: NOOP };

  // src/ts/modules/persist.ts
  var PersistModule = class extends BaseReactorModule {
    static moduleName = "persist";
    adapter;
    hydrateSeq = 0;
    saveTimeoutId = 0;
    get payload() {
      let res = this.rtrs.size > 1 ? {} : void 0;
      for (const [rid, rtr] of this.rtrs) {
        const snap = this.config.useSnapshot ? (this.config.useSnapshot === true && (rtr.config.referenceTracking = rtr.config.smartCloning = true), rtr.snapshot()) : rtr.core, paths = this.getPaths(this.config.whitelist, rid), val = this.config.whitelist ? paths.reduce((acc, p) => (setAny(acc, p, getAny(snap, p)), acc), {}) : snap;
        this.rtrs.size > 1 ? setAny(res, rid, val) : res = val;
      }
      return res;
    }
    constructor(config, rtr) {
      super(mergeObjs(PERSIST_MODULE_BUILD, config), rtr, { hydrated: false });
    }
    wire() {
      "undefined" !== typeof window && window.addEventListener("pagehide", this.onDestroy, { signal: this.signal });
      "undefined" !== typeof document && document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && this.onDestroy(), { signal: this.signal });
      this.config.on("adapter", this.handleAdapter, { signal: this.signal, immediate: true });
      this.config.on("disabled", this.handleDisabled, { signal: this.signal, immediate: true });
      this.config.on("whitelist", this.handleWhitelist, { signal: this.signal, immediate: true });
    }
    onAttach(rtr, rid) {
      for (const p of this.getPaths(this.config.whitelist, rid)) !this.config.disabled ? rtr.on(p, this.save, { signal: this.signal, immediate: true }) : rtr.off(p, this.save);
    }
    async handleAdapter({ value = LocalStorageAdapter }) {
      const seq = ++this.hydrateSeq;
      if (this.adapter && value === this.adapter.constructor) return;
      this.state.hydrated = false;
      this.adapter?.remove(this.config.key);
      this.adapter = "function" === typeof value ? new value({ debug: !!this.rtrs.values().next().value?.canLog }) : value;
      try {
        let saved = this.adapter.get(this.config.key);
        const isAsync = saved instanceof Promise, { depth, merge = true } = parseEvtOpts(this.config.fanout ?? isAsync, fanoutOptsArr, "depth");
        saved = !isAsync ? saved : await saved;
        if (seq !== this.hydrateSeq || !saved) return;
        for (const [rid, rtr] of this.rtrs) {
          const paths = this.getPaths(this.config.whitelist, rid);
          const entry = this.rtrs.size > 1 ? getAny(saved, rid) : saved;
          if (!entry) continue;
          const set = (p, news, olds) => (depth ? fanout : setAny)(rtr.core, p, merge ? mergeObjs(news, olds) : olds, depth ? { depth, crossRealms: rtr.config.crossRealms } : void 0);
          for (const p of this.config.whitelist ? paths : wpArr) set(p, getAny(rtr.core, p), getAny(entry, p));
        }
        for (const [rid, rtr] of this.rtrs) rtr.tick(depth ? "*" : this.config.whitelist ? this.getPaths(this.config.whitelist, rid) : "*");
      } finally {
        if (seq === this.hydrateSeq) this.state.hydrated = true;
      }
    }
    handleDisabled({ value }) {
      for (const [rid, rtr] of this.rtrs) this.onAttach(rtr, rid);
      value && this.adapter?.remove(this.config.key);
    }
    handleWhitelist({ value: paths, oldValue: prevs }) {
      for (const [rid, rtr] of this.rtrs) {
        for (const p of this.getPaths(prevs, rid)) rtr.off(p, this.save);
        for (const p of this.getPaths(paths, rid)) rtr.off(p, this.save), !this.config.disabled && rtr.on(p, this.save, { signal: this.signal, immediate: true });
      }
    }
    save(e) {
      if (this.config.blacklist && this.getPaths(this.config.blacklist, e.reactor).includes(e.path)) return;
      if (!this.state.hydrated) return e.stopImmediatePropagation();
      if (!this.saveTimeoutId) this.saveTimeoutId = setTimeout2(() => (this.adapter.set(this.config.key, this.payload), this.saveTimeoutId = 0), this.config.throttle, this.signal);
    }
    /** Clears persisted payload for this module instance and drops any pending save. */
    clear() {
      clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = -1;
      for (const rtr of this.rtrs.values()) rtr.stall(() => this.saveTimeoutId = 0);
      this.adapter?.remove(this.config.key);
    }
    onDestroy() {
      this.state.hydrated && !this.config.disabled && this.adapter?.set(this.config.key, this.payload);
    }
  };
  var PERSIST_MODULE_BUILD = { disabled: false, key: "REACTOR_STORE", throttle: 2500, useSnapshot: false };

  // src/ts/modules/timeTravel.ts
  var TimeTravelModule = class extends BaseReactorModule {
    static moduleName = "timeTravel";
    lastTimestamp = 0;
    playbackTimeoutId = -1;
    constructor(config, rtr) {
      super({ ...TIME_TRAVEL_MODULE_BUILD, ...config }, rtr, { initialState: {}, history: [], currentFrame: 0, paused: true });
    }
    // ===========================================================================
    // THE FOUNDATION & WIRETAP (Passive Recording)
    // ===========================================================================
    wire() {
      this.lastTimestamp = performance.now();
      this.state.set("currentFrame", (v = 0) => clamp(0, v, this.state.history.length), { signal: this.signal, immediate: true });
      this.config.on("whitelist", this.handleWhitelist, { signal: this.signal, immediate: true });
      !this.state.paused && this.play();
    }
    onAttach(rtr, rid) {
      rtr.config.referenceTracking = rtr.config.smartCloning = rtr.config.eventTimeStamps = true;
      if (!this.state.history.length || !this.state.initialState[rid]) this.state.initialState[rid] = rtr.snapshot();
      for (const p of this.getPaths(this.config.whitelist, rid)) rtr.on(p, this.record, { signal: this.signal });
    }
    handleWhitelist({ value: paths, oldValue: prevs }) {
      for (const [rid, rtr] of this.rtrs) {
        for (const p of this.getPaths(prevs, rid)) rtr.off(p, this.record);
        for (const p of this.getPaths(paths, rid)) rtr.off(p, this.record), rtr.on(p, this.record, { signal: this.signal });
      }
    }
    /** Chronicling the lifecycle of the system, Captures the essence of every mutation wave that bubbles up. */
    record(e, rid = this.rids.get(e.reactor)) {
      if (this.getPaths(this.config.blacklist, rid).includes(e.path)) return;
      if (!this.state.paused) return;
      if (this.state.currentFrame < this.state.history.length) fanout(this.state, "history", this.state.history.slice(0, this.state.currentFrame), { atomic: true });
      if (this.state.history.length >= this.config.maxHistoryLength) fanout(this.state, "history", this.state.history.slice(1), { atomic: true });
      const en = { path: e.target.path, value: e.reactor.snapshot(false, e.target.value), oldValue: e.reactor.snapshot(false, e.target.oldValue), type: e.staticType, deltat: e.timestamp - this.lastTimestamp, rid };
      e.rejected && (en.rejected = e.rejected), !e.target.hadKey && (en.hadKey = false), this.state.history.push(en);
      this.state.currentFrame = this.state.history.length;
      this.lastTimestamp = e.timestamp;
    }
    /** Clears timeline history and resets playhead/genesis to the current reactor state. */
    clear() {
      this.pause();
      this.playbackTimeoutId = -1;
      this.state.history.length = this.state.currentFrame = 0;
      this.state.initialState = Object.fromEntries(this.rtrs.entries().map(([rid, rtr]) => [rid, rtr.snapshot()]));
      this.lastTimestamp = performance.now();
    }
    // ===========================================================================
    // THE TIME MACHINE (Manual Controls)
    // ===========================================================================
    /** Instant state reconstruction (Teleport). Glides through deltas natively. */
    jumpTo(index = 0, keepShield = false) {
      this.state.paused = false;
      const target = clamp(0, index, this.state.history.length), forward = target > this.state.currentFrame;
      while (this.state.currentFrame !== target) {
        const e = this.state.history[forward ? this.state.currentFrame : this.state.currentFrame - 1];
        if (!e) break;
        const rtr = this.rtrs.get(e.rid) || this.rtrs.values().next().value;
        if (forward) e.type === "delete" ? deleteAny(rtr.core, e.path) : setAny(rtr.core, e.path, deepClone(e.value, rtr.config));
        else e.hadKey === false ? deleteAny(rtr.core, e.path) : setAny(rtr.core, e.path, deepClone(e.oldValue, rtr.config));
        forward ? this.state.currentFrame++ : this.state.currentFrame--;
        if (e.rejected) rtr.log(`[Reactor ${this.name} Module] ${forward ? "Replaying" : "Reversing"} REJECTED intent at "${e.path}"`);
      }
      for (const rtr of this.rtrs.values()) rtr.tick();
      if (!keepShield) this.state.paused = true;
    }
    /** Step through time, Moves the playhead and teleports the state. */
    step(stride = 1, forward = true) {
      if (forward ? this.state.currentFrame >= this.state.history.length : this.state.currentFrame <= 0) return;
      this.pause(), forward ? this.jumpTo(this.state.currentFrame + stride) : this.jumpTo(this.state.currentFrame - stride);
    }
    /** Step back in time, Moves the playhead backward and teleports the state. */
    undo = () => this.step(1, false);
    /** Step forward in time, Restores previously undone actions. */
    redo = () => this.step(1, true);
    // ===========================================================================
    // THE VCR (Automated Playback)
    // ===========================================================================
    /** Core automove engine. Replays or rewinds the "Story" by respecting time gaps. */
    async automove(forward = true) {
      this.state.paused = false;
      while ((forward ? this.state.currentFrame < this.state.history.length : this.state.currentFrame > 0) && !this.state.paused) {
        const idx = forward ? this.state.currentFrame : this.state.currentFrame - 1, e = this.state.history[forward ? idx + 1 : idx - 1];
        this.jumpTo(this.state.currentFrame + (forward ? 1 : -1), true);
        if (e?.deltat > 0) await new Promise((res) => this.playbackTimeoutId = setTimeout2(() => res(0), Math.min(e.deltat, this.config.maxPlaybackDelay), this.signal));
      }
      this.state.paused = true;
    }
    /** Start chronological re-enactment of the session. */
    play = () => this.automove(true);
    /** Start reverse chronological re-enactment of the session. */
    rewind = () => this.automove(false);
    /** Pauses the live VCR playback. */
    pause = () => (this.state.paused = true, clearTimeout(this.playbackTimeoutId));
    // ===========================================================================
    // TELEMETRY & I/O (Session Import/Export)
    // ===========================================================================
    /** Exports the current session as a JSON string. */
    export(replacer, space) {
      return JSON.stringify(this.state, replacer, space);
    }
    /** Imports a session from a JSON string, allowing you to replay or analyze past states. */
    import(json, reviver) {
      setAny(this.state, "*", JSON.parse(json, reviver));
      this.lastTimestamp = performance.now();
      const resume = !this.state.paused, target = this.state.currentFrame;
      this.state.paused = false;
      for (const [rid, rtr] of this.rtrs) setAny(rtr.core, "*", deepClone(this.state.initialState[rid], rtr.config)), rtr.tick();
      this.state.currentFrame = 0, this.jumpTo(target), resume && this.play();
    }
  };
  var TIME_TRAVEL_MODULE_BUILD = { maxPlaybackDelay: 2e3 };

  // src/ts/adapters/vanilla.ts
  var vanilla_exports = {};
  __export(vanilla_exports, {
    Autotracker: () => Autotracker,
    TimeTravelOverlay: () => TimeTravelOverlay,
    effect: () => effect,
    withTracker: () => withTracker
  });

  // src/ts/adapters/autotracker.ts
  var Autotracker = class {
    proxy;
    deps = /* @__PURE__ */ new Map();
    isTracking = true;
    rtr;
    /** only allows one reactor to autotrack when available */
    autortr;
    clups = [];
    lastPath;
    proxyCache = /* @__PURE__ */ new WeakMap();
    /** @param rtr Reactor instance used for path subscriptions. */
    constructor(rtr) {
      this.autortr = this.rtr = rtr;
    }
    /**
     * Starts a new tracking pass and returns a readonly tracking proxy for `target` if `this` was instantiated with a `Reactor`.
     * @param target Snapshot (or state branch) to track reads from.
     * @returns Read-tracking readonly proxy.
     * @example
     * const atrkr = new Autotracker(rtr);
     * const state = atrkr.tracked(rtr.snapshot());
     * const name = state.user.profile.name;
     */
    tracked(target) {
      return this.unblock(), this.proxy = this.proxied(target, "");
    }
    proxied(obj, path) {
      if (!this.rtr || !obj || "object" !== typeof obj) return obj;
      const cached = this.proxyCache.get(obj);
      if (cached) return cached;
      if (!canHandle(obj, this.rtr.config, false)) return obj;
      const proxy = new Proxy(obj, {
        // Minimal Proxy Handler
        get: (object, key, receiver) => {
          if (key === RAW) return this.rtr.log(`\u{1F440} [AutoTracker \`get\` Trap] Peeked at ${object}`), object;
          const keyStr = String(key), fullPath = path ? `${path}.${keyStr}` : keyStr;
          return this.rtr.log(`\u{1F50D} [AutoTracker \`get\` Trap] Initiated for "${keyStr}" on "${path}"`), this.track(fullPath), this.proxied(!this.rtr.config.preserveContext ? object[key] : Reflect.get(object, key, receiver), fullPath);
        },
        has: (object, key) => {
          const keyStr = String(key), fullPath = path ? `${path}.${keyStr}` : keyStr;
          return this.rtr.log(`\u2753 [AutoTracker \`has\` Trap] Initiated for "${keyStr}" on "${path}"`), this.track(fullPath), !this.rtr.config.preserveContext ? key in object : Reflect.has(object, key);
        },
        getOwnPropertyDescriptor: (object, key) => {
          const keyStr = String(key), fullPath = path ? `${path}.${keyStr}` : keyStr;
          return this.rtr.log(`\u{1F4CB} [AutoTracker \`getOwnPropertyDescriptor\` Trap] Initiated for "${keyStr}" on "${path}"`), this.track(fullPath), !this.rtr.config.preserveContext ? Object.getOwnPropertyDescriptor(object, key) : Reflect.getOwnPropertyDescriptor(object, key);
        },
        ownKeys: (object) => {
          const safePath = path || "*";
          return this.rtr.log(`\u{1F511} [AutoTracker \`ownKeys\` Trap] Initiated on "${safePath}"`), this.track(safePath), Reflect.ownKeys(object);
        },
        set: (_, key) => {
          throw new Error(`\u{1F6E1}\uFE0F [AutoTracker \`set\` Trap] Blocked for "${String(key)}" on "${path}"`);
        },
        deleteProperty: (_, key) => {
          throw new Error(`\u{1F6E1}\uFE0F [AutoTracker \`deleteProperty\` Trap] Blocked for "${String(key)}" on "${path}"`);
        },
        defineProperty: (_, key) => {
          throw new Error(`\u{1F6E1}\uFE0F [AutoTracker \`defineProperty\` Trap] Blocked for "${String(key)}" on "${path}"`);
        },
        setPrototypeOf: (_, key) => {
          throw new Error(`\u{1F6E1}\uFE0F [AutoTracker \`setPrototypeOf\` Trap] Blocked for "${String(key)}" on "${path}"`);
        }
      });
      return this.proxyCache.set(obj, proxy), proxy;
    }
    /** Adds a path to the tracking set. */
    track(path, rtr = this.rtr, prune = false) {
      if (!this.isTracking || !path || this.autortr && this.autortr !== rtr) return path;
      let paths = this.deps.get(rtr);
      if (!prune && !paths) paths = (this.deps.set(rtr, paths = /* @__PURE__ */ new Set()), paths);
      if (path.startsWith(this.lastPath + ".")) paths.delete(this.lastPath);
      return !prune && paths.add(this.lastPath = path), path;
    }
    /** Removes a path from the tracking set. */
    untrack(path, rtr = this.rtr) {
      this.deps.get(rtr)?.delete(path);
    }
    /** Enables path tracking. */
    unblock(rtr = this.rtr) {
      this.deps.clear();
      this.autortr = rtr;
      this.isTracking = true;
      this.lastPath = void 0;
    }
    /** Temporarily disables path tracking. */
    block() {
      this.autortr = void 0;
      this.isTracking = false;
    }
    /**
     * Subscribes an effect to tracked paths.
     * Uses `watch` when `options.sync === true` (synchronous updates), otherwise
     * uses `on` (batched/asynchronous listener wave).
     * @param cb Effect callback.
     * @param options Effect options.
     * @returns Cleanup function for active subscriptions.
     * @example
     * const atrkr = new Autotracker(rtr);
     * const view = atrkr.tracked(rtr.snapshot()); // tracked works if `rtr` was passed at instantiation
     * view.user.name;
     * const stop = atrkr.callback(() => console.log("changed")); // re-run after when ".user.name" changes
     * @example Packaged Customization
     * const atrkr = new Autotracker(); // no reactor passed
     * withTracker(atrkr, () => state.user.name); // import `withTracker` too
     * const stop = atrkr.callback(() => console.log("sync"), { sync: true }); // re-run immediately when ".user.name" changes, works on any path used from any reactor state
     * @example Extensive Customization
     * atrkr.unblock();
     * const prev = CTX.autotracker;
     * CTX.autotracker = atrkr; // import CTX first
     * state.user.name;
     * CTX.autotracker = prev;
     */
    callback(cb, options = NIL) {
      this.cleanup();
      const method = options.sync ? "watch" : "on";
      for (const [rtr, paths] of this.deps) {
        if (!paths.size || paths.has("*")) rtr && this.clups.push(rtr[method]("*", cb, options));
        else for (const path of paths) this.clups.push(rtr[method](path, cb, options));
      }
      return () => this.cleanup();
    }
    /** Clears active subscriptions and blocks tracking. */
    cleanup() {
      this.block();
      for (let i = 0, len = this.clups.length; i < len; i++) this.clups[i]();
      this.clups.length = 0;
    }
    destroy() {
      this.deps.clear(), this.cleanup(), nuke(this);
    }
  };
  function withTracker(tracker, run, rtr) {
    const prev = CTX.autotracker;
    CTX.autotracker = tracker;
    try {
      return tracker.unblock(rtr), run();
    } finally {
      CTX.autotracker = prev;
    }
  }

  // src/ts/adapters/vanilla/effect.ts
  function effect(callback, options) {
    const atrkr = new Autotracker();
    let destroyed = false;
    (function execute() {
      if (!destroyed) withTracker(atrkr, () => callback()), atrkr.callback(execute, options);
    })();
    return () => (destroyed = true, atrkr.destroy());
  }

  // src/ts/adapters/vanilla/TimeTravelOverlay.ts
  var keys = {
    overrides: ["Ctrl+z", "Cmd+z", "Ctrl+y", "Cmd+y", "Ctrl+Shift+z", "Cmd+Shift+z", "Home", "End", ",", ".", "ArrowLeft", "ArrowRight", "Space", "Alt+Space", "Escape", "Delete", "e", "i", "c"],
    shortcuts: { undo: ["Ctrl+z", "Cmd+z"], redo: ["Ctrl+y", "Cmd+y", "Ctrl+Shift+z", "Cmd+Shift+z"], genesis: "Home", ending: "End", prevFrame: ",", nextFrame: ".", skipBwd: "ArrowLeft", skipFwd: "ArrowRight", playPause: "Space", rewind: "Alt+Space", closeOverlay: "Escape", clrHistory: "Delete", export: "e", import: "i", clear: "c" }
  };
  var TimeTravelOverlay = class _TimeTravelOverlay {
    static count = 0;
    index = _TimeTravelOverlay.count;
    config;
    state = reactive({ open: false, import: "" });
    time;
    els;
    clups = [];
    keyup;
    /** Creates a docked TimeTravel overlay bound to a module instance.
     * @param time TimeTravel module instance that owns timeline operations.
     * @param build Optional initial overlay config overrides.
     */
    constructor(time, build = {}) {
      this.time = time;
      this.config = reactive({ title: `Time Travel Overlay ${this.index = ++_TimeTravelOverlay.count}`, ...build });
      this.state.open = !!this.config.startOpen;
      const s = this.time.state, host = createEl("div", { className: "tt-overlay-host" }), toggle = createEl("button", { className: "tt-overlay-toggle", type: "button", onclick: () => this.state.open = !this.state.open }), panel = createEl("aside", { className: "tt-overlay", ariaLabel: "time travel overlay" }), title = createEl("div", { className: "title" }), frame = createEl("span", { className: "muted" }), clrHistory = createEl("button", { textContent: `Clear History${formatKeyForDisplay(keys.shortcuts.clrHistory)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.clrHistory, false), onclick: () => (this.time.clear(), this.state.import = "") }), undo = createEl("button", { textContent: `Undo${formatKeyForDisplay(keys.shortcuts.undo[0])}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.undo, false), onclick: this.time.undo }), redo = createEl("button", { textContent: `Redo${formatKeyForDisplay(keys.shortcuts.redo[0])}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.redo, false), onclick: this.time.redo }), genesis = createEl("button", { textContent: `Genesis${formatKeyForDisplay(keys.shortcuts.genesis)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.genesis, false), onclick: () => this.time.jumpTo(0) }), playPause = createEl("button", { onclick: () => this.time[s.paused ? "play" : "pause"](), ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.playPause, false) }), rewind = createEl("button", { textContent: `Rewind${formatKeyForDisplay(keys.shortcuts.rewind)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.rewind, false), onclick: this.time.rewind }), range = createEl("input", { type: "range", min: "0", max: "0", value: "0", title: "time travel frame", ariaLabel: "time travel frame", oninput: () => this.time.jumpTo(Number(range.value)) }), exp = createEl("button", { textContent: `Export${formatKeyForDisplay(keys.shortcuts.export)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.export, false), onclick: () => this.state.import = this.time.export(null, 2) }), imp = createEl("button", { textContent: `Import${formatKeyForDisplay(keys.shortcuts.import)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.import, false), onclick: () => this.state.import.trim().length && this.time.import(this.state.import) }), clr = createEl("button", { textContent: `Clear${formatKeyForDisplay(keys.shortcuts.clear)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.clear, false), onclick: () => this.state.import = "" }), payload = createEl("textarea", { className: "tt-io", readOnly: true, placeholder: "current payload json", title: "current payload" }), io = createEl("textarea", { className: "tt-io", placeholder: "timeline payload json", oninput: () => this.state.import = io.value }), foot = createEl("p", { className: "tt-footnote", textContent: "Want this in your app? " }), link = createEl("a", { target: "_blank", rel: "noreferrer noopener", textContent: "sia-reactor", href: "https://www.npmjs.com/package/sia-reactor" }), box = createEl("div", { className: "tt-status-box" }), status = createEl("div", { className: "tt-status-row" }), row1 = createEl("div", { className: "tt-row" }), row2 = createEl("div", { className: "tt-row" }), row3 = createEl("div", { className: "tt-row" });
      status.append((box.append(frame), box), clrHistory);
      panel.append(title, status, (row1.append(undo, redo, genesis), row1), (row2.append(playPause, rewind), row2), payload, range, (row3.append(exp, imp, clr), row3), io, (foot.appendChild(link), foot));
      host.append(toggle, panel);
      this.els = { host, toggle, panel, title, frame, clrHistory, undo, redo, genesis, playPause, rewind, range, exp, imp, clr, payload, io };
      this.keyup = (e) => {
        const a = this.state.open && (this.config.devOnly ? CTX.isDevEnv : true) && keyEventAllowed(e, keys);
        a === "undo" ? this.time.undo() : a === "redo" ? this.time.redo() : a === "genesis" ? this.time.jumpTo(0) : a === "ending" ? this.time.jumpTo(s.history.length) : a === "prevFrame" ? this.time.step(1, false) : a === "nextFrame" ? this.time.step(1, true) : a === "skipBwd" ? this.time.step(5, false) : a === "skipFwd" ? this.time.step(5, true) : a === "rewind" ? this.time.rewind() : a === "playPause" ? this.time[s.paused ? "play" : "pause"]() : a === "clrHistory" ? this.time.clear() : a === "closeOverlay" ? this.state.open = false : a === "export" ? this.state.import = this.time.export() : a === "import" ? this.state.import.trim().length && this.time.import(this.state.import) : a === "clear" && (this.state.import = "");
      };
      window.addEventListener("keydown", this.keyup);
      const sync = [
        effect(() => this.config.color ? host.style.setProperty("--sia-tt-color", this.config.color) : host.style.removeProperty("--sia-tt-color")),
        effect(() => {
          if (this.config.devOnly && !CTX.isDevEnv) return void host.remove();
          const dock = getDock(this.config.container);
          if (host.parentNode !== dock) dock.appendChild(host);
        }),
        effect(() => toggle.textContent = `${(panel.hidden = !this.state.open) ? "Show" : "Hide"} ${title.textContent = this.config.title ?? ""}`),
        effect(() => playPause.textContent = `${s.paused ? "Play" : "Pause"}${formatKeyForDisplay(keys.shortcuts.playPause)}`),
        effect(() => {
          frame.textContent = `Frame: ${s.currentFrame} / ${s.history.length}`;
          range.disabled = clrHistory.disabled = !s.history.length;
          genesis.disabled = undo.disabled = !s.currentFrame;
          rewind.disabled = !s.paused || !s.currentFrame;
          playPause.disabled = redo.disabled = s.currentFrame >= s.history.length;
          range.max = String(s.history.length);
          range.value = String(Math.min(s.currentFrame, s.history.length));
          payload.value = JSON.stringify(s.currentFrame ? s.history[s.currentFrame - 1] : { type: "genesis", value: s.initialState }, null, 2);
        }),
        effect(() => {
          clr.disabled = imp.disabled = !this.state.import.trim().length;
          io.value !== this.state.import && (io.value = this.state.import);
        })
      ];
      this.clups.push(...sync);
    }
    destroy() {
      for (const clup of this.clups) clup();
      this.keyup && window.removeEventListener("keydown", this.keyup);
      this.els.host.remove();
      nuke(this), --_TimeTravelOverlay.count;
    }
  };
  function getDirChild(parent, className) {
    for (const child of parent.children) if (child instanceof HTMLElement && child.classList.contains(className)) return child;
  }
  function getDock(container) {
    const host = container && container !== document.documentElement ? container : document.body;
    if (host !== document.body && getComputedStyle(host).position === "static") host.style.position = "relative";
    const layer = getDirChild(host, "tt-overlay-layer") || createEl("div", { className: "tt-overlay-layer" }, void 0, { position: host === document.body ? "fixed" : "absolute" });
    if (layer.parentElement !== host) host.appendChild(layer);
    const dock = getDirChild(layer, "tt-overlay-dock") || createEl("div", { className: "tt-overlay-dock" });
    return dock.parentElement !== layer && layer.appendChild(dock), dock;
  }

  // src/ts/super.ts
  var adapters = { vanilla: vanilla_exports };
  return __toCommonJS(super_exports);
})();
