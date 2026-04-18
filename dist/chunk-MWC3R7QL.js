import {
  reactive
} from "./chunk-3UHI7CNE.js";
import {
  createEl,
  formatKeyForDisplay,
  keyEventAllowed,
  parseForARIAKS
} from "./chunk-5A44QFT6.js";
import {
  CTX,
  NIL,
  RAW,
  canHandle,
  nuke
} from "./chunk-EZ4VRGYI.js";

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

export {
  Autotracker,
  withTracker,
  effect,
  TimeTravelOverlay
};
