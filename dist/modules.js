import {
  getReactor,
  reactive
} from "./chunk-3UHI7CNE.js";
import {
  clamp,
  guardAllMethods,
  guardMethod,
  setTimeout
} from "./chunk-P37ADJMM.js";
import {
  NIL,
  NOOP,
  deepClone,
  deleteAny,
  fanout,
  fanoutOptsArr,
  getAny,
  isObj,
  mergeObjs,
  parseEvtOpts,
  setAny
} from "./chunk-EZ4VRGYI.js";

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
  constructor(config, rtr, state) {
    guardAllMethods(this, this.guard);
    this.config = isObj(config) ? reactive(config) : config;
    this.state = isObj(state) ? reactive(state) : state;
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
    if (!this.saveTimeoutId) this.saveTimeoutId = setTimeout(() => (this.adapter.set(this.config.key, this.payload), this.saveTimeoutId = 0), this.config.throttle, this.signal);
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
      if (e?.deltat > 0) await new Promise((res) => this.playbackTimeoutId = setTimeout(() => res(0), Math.min(e.deltat, this.config.maxPlaybackDelay), this.signal));
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
export {
  AsyncStorageAdapter,
  BaseReactorModule,
  BaseStorageAdapter,
  COOKIE_ADAPTER_BUILD,
  CookieAdapter,
  INDEXED_DB_ADAPTER_BUILD,
  IndexedDBAdapter,
  LocalStorageAdapter,
  MemoryAdapter,
  PERSIST_MODULE_BUILD,
  PersistModule,
  SessionStorageAdapter,
  StorageAdapter,
  TIME_TRAVEL_MODULE_BUILD,
  TimeTravelModule
};
