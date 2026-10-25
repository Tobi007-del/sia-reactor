import { Reactive, reactive } from "@core/mixins";
import { CTX } from "@core/consts";
import { wpArr } from "@modules/base";
import { TimeTravelModule } from "@modules/timeTravel";
import { createEl } from "@utils/dom";
import { nuke } from "@utils/obj";
import { formatKeyTooltip as formatKT, keyEventAllowed, KEYS_BLOCKS, parseForARIAKS } from "@utils/keys";
import { effect } from "./effect";

const keys = {
  blocks: KEYS_BLOCKS,
  whitelist: ["Escape"] as const,
  // overrides: ["Space", "Home", "End", "Escape", "Delete"], // Playing "God" now
  shortcuts: { undo: ["Ctrl+z", "Cmd+z"], redo: ["Ctrl+y", "Ctrl+Shift+z", "Cmd+Shift+z"], genesis: "Home", trackUntrack: "t", ending: "End", playPause: "Space", rewind: "Shift+Space", prune: "Insert", reset: "Delete", export: "e", import: "i", clear: "x", copy: "c", toggle: "Ctrl + `" },
};

/** Reactive options for the TimeTravel console instance. */
export interface TimeTravelConsoleConfig {
  /** Header text shown at the top of the console panel. */
  title: string;
  /** Accent color used to derive panel theme variables. */
  color: string;
  /** Shows the console only in development when true. */
  devOnly: boolean;
  /** Initial open state applied when the console is created. */
  startOpen: boolean;
  /** Container element that owns the console layer and dock. */
  container?: HTMLElement;
}

/**
 * - Vanilla console controller for visual time-travel controls and timeline I/O.
 * - Mounts a docked HUD into the configured container, syncs its UI with module state, and forwards keyboard/button actions to the TimeTravelModule.
 * Supports reactive `config` updates (title/color/container/devOnly) and maintains local console UI state (`open` and `import` payload text).
 */
export class TimeTravelConsole {
  public static count = 0;
  public index = TimeTravelConsole.count;
  public config: Reactive<TimeTravelConsoleConfig>;
  public readonly state = reactive({ open: false, import: "", stride: 1 });
  public readonly time: TimeTravelModule;
  public readonly host: HTMLElement;
  private clups: Array<() => void> = [];
  private keydown: (e: KeyboardEvent) => void;

  /** Creates a docked TimeTravel console overlay bound to a module instance.
   * @param time TimeTravel module instance that owns timeline operations.
   * @param build Optional initial console config overrides.
   */
  constructor(time: TimeTravelModule, build: Partial<TimeTravelConsoleConfig> = { devOnly: true }) {
    this.time = time;
    this.config = reactive({ title: `Time Travel Console ${(this.index = ++TimeTravelConsole.count)}`, ...build } as TimeTravelConsoleConfig);
    this.state.open = !!this.config.startOpen;
    let wlLive = false,
      blLive = false;
    const s = this.time.state,
      host = (this.host = createEl("div", { className: "sia-tt-console-host" })),
      toggle = createEl("button", { className: "sia-tt-console-toggle", type: "button", title: `Toggle Overlay${formatKT(keys.shortcuts.toggle)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts.toggle), onclick: () => (this.state.open = !this.state.open) }),
      panel = createEl("aside", { className: "sia-tt-console", ariaLabel: "time travel console" }),
      title = createEl("div", { className: "title" }),
      frame = createEl("span", { className: "muted" }),
      prune = createEl("button", { textContent: `Prune${formatKT(keys.shortcuts!.prune)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.prune), onclick: () => this.time.prune() }),
      reset = createEl("button", { textContent: `Reset${formatKT(keys.shortcuts!.reset)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.reset), onclick: () => (this.time.reset(), (this.state.import = "")) }),
      undo = createEl("button", { textContent: `Undo${formatKT(keys.shortcuts!.undo[0])}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.undo), onclick: () => this.time.undo(this.state.stride) }),
      redo = createEl("button", { textContent: `Redo${formatKT(keys.shortcuts!.redo[0])}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.redo), onclick: () => this.time.redo(this.state.stride) }),
      genesis = createEl("button", { textContent: `Genesis${formatKT(keys.shortcuts!.genesis)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.genesis), onclick: () => this.time.jumpTo(0) }),
      playPause = createEl("button", { onclick: () => this.time[s.paused ? "play" : "pause"](), ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.playPause) }),
      rewind = createEl("button", { textContent: `Rewind${formatKT(keys.shortcuts!.rewind)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.rewind), onclick: this.time.rewind }),
      trackUntrack = createEl("button", { onclick: () => this.time[s.tracking ? "untrack" : "track"](), ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.trackUntrack) }),
      range = createEl("input", { type: "range", min: "0", title: "time travel frame", ariaLabel: "time travel frame", oninput: () => this.time.jumpTo(Number(range.value)) }),
      exp = createEl("button", { textContent: `Export${formatKT(keys.shortcuts!.export)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.export), onclick: () => (this.state.import = this.time.export(null, 2)) }),
      imp = createEl("button", { textContent: `Import${formatKT(keys.shortcuts!.import)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.import), onclick: () => this.state.import.trim().length && this.time.import(this.state.import) }),
      clr = createEl("button", { textContent: `Clear${formatKT(keys.shortcuts!.clear)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.clear), onclick: () => (this.state.import = "") }),
      copy = createEl("button", { textContent: `Copy${formatKT(keys.shortcuts!.copy)}`, ariaKeyShortcuts: parseForARIAKS(keys.shortcuts!.copy), onclick: () => this.state.import.trim().length && navigator.clipboard?.writeText(this.state.import).catch?.(() => {}) }),
      payload = createEl("textarea", { className: "sia-tt-io", readOnly: true, placeholder: "current payload json", title: "Current History Entry" }),
      io = createEl("textarea", { className: "sia-tt-io", placeholder: "timeline payload json", title: "Time History", oninput: () => (this.state.import = io.value) }),
      foot = createEl("p", { className: "sia-tt-footnote", innerHTML: "<span>Try this in your app? </span>" }),
      link = createEl("a", { target: "_blank", rel: "noreferrer noopener", textContent: "sia-reactor", href: "https://www.npmjs.com/package/sia-reactor" }),
      box = createEl("div", { className: "sia-tt-status-box" }),
      status = createEl("div", { className: "sia-tt-status-row" }),
      filters = createEl("div", { className: "sia-tt-status-row" }),
      filterBox = createEl("div", { className: "sia-tt-status-box" }),
      whitelistLabel = createEl("span", { className: "muted", textContent: "Whitelist:" }),
      blacklistLabel = createEl("span", { className: "muted", textContent: "Blacklist:" }),
      whitelist = createEl("input", { className: "sia-tt-filter-input sia-tt-io", placeholder: 'a.b, c.d or {"0":["a.b"]}', title: "Whitelist paths", onfocus: () => (wlLive = true), onblur: () => ((wlLive = false), (whitelist.value = formatPaths(this.time.config.whitelist, "*"))), oninput: (_, parsed: any = parsePaths(whitelist.value)) => parsed !== null && (this.time.config.whitelist = parsed) }),
      blacklist = createEl("input", { className: "sia-tt-filter-input sia-tt-io", placeholder: 'a.b, c.d or {"0":["a.b"]}', title: "Blacklist paths", onfocus: () => (blLive = true), onblur: () => ((blLive = false), (blacklist.value = formatPaths(this.time.config.blacklist, ""))), oninput: (_, parsed: any = parsePaths(blacklist.value, true)) => parsed !== null && (this.time.config.blacklist = parsed) }),
      speed = createEl("select", { className: "sia-tt-speed", title: "Playback Speed", onchange: () => (this.time.state.playbackRate = Number(speed.value)) }),
      stride = createEl("input", { className: "sia-tt-stride sia-tt-button sia-tt-mini-input", type: "number", min: "1", title: "Skip Stride i.e. how many steps count as one unit", oninput: () => (this.state.stride = Math.max(1, Number(stride.value) || 1)) }),
      stats = createEl("span", { className: "sia-tt-stats" }),
      limit = createEl("input", { className: "sia-tt-limit sia-tt-mini-input sia-tt-button", type: "number", min: "1", title: "Maximum number of history entries kept in memory before older entries are discarded.", oninput: () => (this.time.config.limit = Math.max(1, Number(limit.value) || 1)) }),
      delay = createEl("input", { className: "sia-tt-delay sia-tt-mini-input sia-tt-button", type: "number", min: "0", step: "50", title: "Maximum playback delay between timeline frames in milliseconds.", oninput: () => (this.time.config.maxPlaybackDelay = Math.max(0, Number(delay.value) || 0)) }),
      read = createEl("label", { className: "sia-tt-check", title: "When recording intent mutations, read previous values from the matching state path instead of the intent path. Useful for accurate undo reconstruction of intent-driven flows." }),
      readBox = createEl("input", { type: "checkbox", checked: !!this.time.config.mirrorReads, onchange: () => (this.time.config.mirrorReads = readBox.checked) }),
      write = createEl("label", { className: "sia-tt-check", title: "During playback and teleportation, mirror state writes into matching intent paths to re-enact the recorded history. Useful for accurate reconstruction of the whole session." }),
      writeBox = createEl("input", { type: "checkbox", checked: !!this.time.config.mirrorWrites, onchange: () => (this.time.config.mirrorWrites = writeBox.checked) }),
      filterRow1 = createEl("div", { className: "sia-tt-filter-row" }),
      filterRow2 = createEl("div", { className: "sia-tt-filter-row" }),
      row1 = createEl("div", { className: "sia-tt-row" }),
      row2 = createEl("div", { className: "sia-tt-row" }),
      row3 = createEl("div", { className: "sia-tt-row" }),
      row4 = createEl("div", { className: "sia-tt-row" }),
      row5 = createEl("div", { className: "sia-tt-row sia-tt-config-row" });
    speed.append(...[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4, 8, 16, 32].map((v) => createEl("option", { value: String(v), textContent: `${v}x` })));
    status.append((box.append(frame), box), prune, reset);
    filters.append((filterBox.append((filterRow1.append(whitelistLabel, whitelist), filterRow1), (filterRow2.append(blacklistLabel, blacklist), filterRow2)), filterBox));
    panel.append(title, status, (row1.append(playPause, rewind, genesis), row1), (row2.append(undo, redo, trackUntrack, stride), row2), payload, (row3.append(speed, range), row3), filters, (row4.append(exp, imp, copy, clr), row4), io, (row5.append(delay, limit, (read.append(readBox, " Read Mirror"), read), (write.append(writeBox, " Write Mirror"), write)), row5), (foot.prepend(stats), foot.append(link), foot));
    this.host.append(toggle, panel);
    this.keydown = (e, can = this.config.devOnly ? CTX.isDevEnv : true, a = can && keyEventAllowed(e, keys), will = a === "toggle" || (a && this.state.open)) =>
      will && ((e.preventDefault(), e.stopImmediatePropagation()), a === "toggle" ? (this.state.open = !this.state.open) : a === "escape" ? (this.state.open = false) : a === "undo" ? this.time.undo(this.state.stride) : a === "redo" ? this.time.redo(this.state.stride) : a === "genesis" ? this.time.jumpTo(0) : a === "trackUntrack" ? this.time[s.tracking ? "untrack" : "track"]() : a === "ending" ? this.time.jumpTo(s.history.length) : a === "rewind" ? this.time.rewind() : a === "playPause" ? this.time[s.paused ? "play" : "pause"]() : a === "prune" ? this.time.prune() : a === "reset" ? this.time.reset() : a === "export" ? (this.state.import = this.time.export(null, 2)) : a === "import" ? this.state.import.trim().length && this.time.import(this.state.import) : a === "clear" ? (this.state.import = "") : a === "copy" && this.state.import.trim().length && navigator.clipboard?.writeText(this.state.import).catch?.(() => {}));
    window.addEventListener("keydown", this.keydown, { capture: true });
    const sync = [
      effect(() => (this.config.color ? host.style.setProperty("--sia-tt-color", this.config.color) : host.style.removeProperty("--sia-tt-color"))),
      effect(() => {
        if (this.config.devOnly && !CTX.isDevEnv) return void host.remove();
        const dock = getDock(this.config.container);
        if (host.parentNode !== dock) dock.appendChild(host);
      }),
      effect(() => (toggle.textContent = `${(panel.hidden = !this.state.open) ? "Show" : "Hide"} ${(title.textContent = this.config.title ?? "")}`)),
      effect(() => (playPause.textContent = `${s.paused ? "Play" : "Pause"}${formatKT(keys.shortcuts!.playPause)}`)),
      effect(() => (trackUntrack.textContent = `${s.tracking ? "Untrack" : "Track"}${formatKT(keys.shortcuts!.trackUntrack)}`)),
      effect((sets = 0, txs = 0) => {
        range.max = String(s.history.length);
        range.disabled = reset.disabled = !s.history.length;
        for (let i = 0, len = s.history.length; i < len; i++) {
          const frame = s.history[i];
          "nodes" in frame ? txs++ : frame.type === "set" && sets++;
        }
        stats.textContent = `Sets: ${sets} | Deletes: ${s.history.length - sets - txs} | Txs: ${txs}`;
      }),
      effect(() => {
        frame.textContent = `Frame: ${s.currentFrame} / ${s.history.length}`;
        genesis.disabled = undo.disabled = !this.time.canUndo;
        redo.disabled = prune.disabled = !this.time.canRedo;
        playPause.disabled = s.paused && redo.disabled;
        rewind.disabled = !s.paused || !s.currentFrame;
        range.value = String(Math.min(s.currentFrame, s.history.length));
        try {
          payload.value = JSON.stringify(s.currentFrame ? s.history[s.currentFrame - 1] : { genesis: true, value: s.initialState }, null, 2);
        } catch (_) {
          payload.value = s.currentFrame ? JSON.stringify(s.history[s.currentFrame - 1], null, 2) : '{ "genesis": true }';
        }
      }),
      effect(() => {
        clr.disabled = copy.disabled = imp.disabled = !this.state.import.trim().length;
        io.value !== this.state.import && (io.value = this.state.import);
      }),
      effect((v = String(s.playbackRate)) => v !== speed.value && (speed.value = v)),
      effect((v = String(this.state.stride)) => v !== stride.value && (stride.value = v)),
      effect((v = String(this.time.config.limit)) => v !== limit.value && (limit.value = v)),
      effect((v = String(this.time.config.maxPlaybackDelay)) => v !== delay.value && (delay.value = v)),
      effect((v = !!this.time.config.mirrorReads) => v !== readBox.checked && (readBox.checked = v)),
      effect((v = !!this.time.config.mirrorWrites) => v !== writeBox.checked && (writeBox.checked = v)),
      effect(() => (!wlLive && (whitelist.value = formatPaths(this.time.config.whitelist, "*")), !blLive && (blacklist.value = formatPaths(this.time.config.blacklist, "")))),
    ];
    this.clups.push(...sync);
  }

  destroy() {
    for (const clup of this.clups) clup();
    window.removeEventListener("keydown", this.keydown, { capture: true });
    this.host.remove(), nuke(this), --TimeTravelConsole.count;
  }
}

function getDock(container?: HTMLElement) {
  const host = container && container !== document.documentElement ? container : document.body;
  if (host !== document.body && getComputedStyle(host).position === "static") host.style.position = "relative";
  const layer = host.querySelector(":scope > .sia-tt-console-layer") || createEl("div", { className: "sia-tt-console-layer" }, undefined, { position: host === document.body ? "fixed" : "absolute" });
  if (layer.parentElement !== host) host.appendChild(layer);
  const dock = layer.querySelector(":scope > .sia-tt-console-dock") || createEl("div", { className: "sia-tt-console-dock" });
  return dock.parentElement !== layer && layer.appendChild(dock), dock;
}
function formatPaths(paths: unknown, emptyText: string): string {
  return !paths ? emptyText : Array.isArray(paths) ? (paths.length ? paths.join(", ") : emptyText) : "object" === typeof paths ? JSON.stringify(paths) : String(paths);
}
function parsePaths(raw: string, allowEmpty = false): unknown {
  const text = raw.trim();
  if (!text) return allowEmpty ? undefined : wpArr;
  if (text[0] === "{")
    try {
      const parsed = JSON.parse(text);
      if (parsed && "object" === typeof parsed) return parsed;
    } catch {
      return null; // invalid JSON resets to last valid
    }
  // prettier-ignore
  const list = text.split(",").map((p) => p.trim()).filter(Boolean);
  return list.length ? list : allowEmpty ? undefined : wpArr;
}
