import { BaseReactorModule } from "../base";
import { Reactor } from "@core/reactor";
import type { Payload, REvent } from "@defs/reactor";
import { setPath, deletePath, fanout, deepClone, getPath } from "@utils/obj";
import { setTimeout } from "@utils/fn";
import { clamp } from "@utils/num";
import type { Paths } from "@defs/obj";
import { JSONReplacer, JSONReviver } from "../persist/storage";
import { mirror } from "@utils/str";
import { withMeta, force } from "@utils/meta";
import { TemporalConfig, TemporalState, HistoryTransaction, HistoryEntry, HistoryNode } from "./types";
import { TEMPORAL_MODULE_BUILD } from "./build";
import { Transaction } from "./transaction";

/**
 * - The Flight Recorder (Black Box).
 * - Implements S.I.A. logic to allow playback, teleportation, redos and undos.
 * Allows history from single or multiple reactors to be recorded and replayed in a synchronized manner, even if they have different shapes.
 * If paired with async persistence, `untrack()` then `track()` this module after hydration where applicable to avoid recording hydration waves.
 */
export class TemporalModule<T extends object = any, P extends Paths<T> = Paths<T>> extends BaseReactorModule<T, TemporalConfig<T, P>, TemporalState<T, P>> {
  public static readonly moduleName: string = "temporal";
  public readonly txMap = new WeakMap<Transaction, HistoryTransaction<T, P>>();
  public readonly evtOpts = { capture: true, signal: this.signal }; // capture for change immediacy devoid of UI lag
  public timestamp = 0;
  protected playSeq = 0;
  protected tracked?: boolean; // `untrack()` must `track()` in the same session to prevent hydration bugs

  constructor(config?: Partial<TemporalConfig<T, P>>, rtr?: Reactor<T>) {
    super({ ...TEMPORAL_MODULE_BUILD, ...config } as TemporalConfig<T, P>, rtr, { initialState: {}, history: [], tracking: true, currentFrame: 0, paused: true, forward: true, playbackRate: 1 } as TemporalState<T, P>);
  }

  // ===========================================================================
  // THE FOUNDATION & WIRETAP (Passive Recording)
  // ===========================================================================
  public override wire(): void {
    // Variables Assignment
    this.timestamp = performance.now();
    // Config Listeners
    this.config.on("whitelist", this.handleWhitelist, { signal: this.signal, init: true });
    this.config.on("synchronous", this.handleSynchronous, { signal: this.signal });
    // Post Wiring
    !this.state.paused && this.automove(this.state.forward); // will only succed with sync persist
  }

  protected override onAttach(rtr: Reactor<any>, rid: string): void {
    rtr.config.eventCapturing = rtr.config.referenceTracking = rtr.config.smartCloning = rtr.config.eventTimeStamps = true;
    if (!this.state.history.length || !this.state.initialState[rid]) this.state.initialState[rid] = this.getPayload(rtr, rid);
    this.attachPaths(rtr, rid);
  }

  protected override onPath = this.record;
  /** Chronicling the lifecycle of the system, Captures the essence of every mutation wave that bubbles up. */
  protected record(e: REvent<any, P> | Payload<any, P>, rid = this.rids.get(e.reactor)!): void {
    if (!this.state.paused || !(this.tracked ?? this.state.tracking) || e.silent) return;
    const timestamp = (e as any).timestamp ?? performance.now(); // payloads dont allow timestamps since they're sync, but you asked for it
    let _mirror: string,
      en = { path: e.target.path, to: e.reactor.snapshot(false, e.target.value), from: e.reactor.snapshot(false, !this.config.mirrorReads || (_mirror = mirror(e.target.path, e.reactor.core)) === e.target.path ? e.target.oldValue : getPath(e.reactor.core as any, _mirror)), type: (e as any).staticType ?? e.type, rid, deltat: timestamp - this.timestamp } as HistoryEntry<any, P>;
    !e.target.hadKey && (en.hadKey = false); // reducing serialized bloat
    const px = (e.tx && this.txMap.get(e.tx)) || null; // previous tx
    if (this.config.beforeEntry) {
      const res = this.config.beforeEntry(en, this.state.history, e); // the power to edit history as it unfolds, or even block it entirely if you want to be a total control freak about it
      if (res === false) return px && (px.nodes.length ? this.resolve(e.tx!, timestamp, en.deltat, px) : (px.end = timestamp), force(() => (this.state.currentFrame = this.state.history.length))), void (this.timestamp = timestamp); // block entry but stretch end time if tx exists, and update metronome
      if (res && res !== true) en = res;
    }
    this.prune(); // destroy the "Alternate Future" (the redo stack) before recording
    e.tx ? this.resolve(e.tx, timestamp, en.deltat, px).nodes.push(en) : this.state.history.push(en); // hybrid so no more space than necessary
    force(() => (this.state.currentFrame = this.state.history.length), !!e.tx), (this.timestamp = timestamp); // Lock the playhead to the absolute present, re-trigger if tx, Update the metronome
    while (this.state.history.length > this.config.limit) this.state.history.shift(), this.state.currentFrame--; // Drop the oldest memories if we exceed the limit, `>` since after entering
  }
  /** Resolves and constructs the hierarchical ancestry for nested transactions as they bubble up from the depths. */
  protected resolve(tx: Transaction, timestamp: number, deltat: number, px: HistoryTransaction<T, P> | null | undefined = this.txMap.get(tx)): HistoryTransaction<T, P> {
    if (px) return (px.end = timestamp), !px.nodes.length ? (tx.parent ? this.resolve(tx.parent, timestamp, deltat).nodes.push(px) : this.state.history.push(px)) : tx.parent && this.resolve(tx.parent, timestamp, deltat), px; // this is peak analytical metrics here
    this.txMap.set(tx, (px = { id: tx.id, label: tx.label, nodes: [], deltat: 0, start: timestamp, end: timestamp } as HistoryTransaction<T, P>)); // start and end unlike singular mutations
    return tx.parent ? this.resolve(tx.parent, timestamp, deltat).nodes.push(px) : ((px.deltat = deltat), this.state.history.push(px)), px;
  }

  /** Resumes the passive recording of state changes. */
  public track(): void {
    (this.state.tracking = this.tracked = true), !this.state.paused && this.automove(this.state.forward); // peak init assist :)
  }
  /** Pauses the passive recording of state changes and returns `this`. Useful to call at creation time to avoid recording hydration waves. @returns `this` */
  public untrack() {
    this.timestamp = performance.now(); // Reset delta-t baseline
    return (this.state.tracking = this.tracked = false), this;
  }

  /**
   * Prunes history nodes from the given index (or currentFrame) upwards, discarding the future redo stack.
   * @param index Starting history index to prune upwards from, defaults to `this.state.currentFrame`.
   */
  public prune(index = this.state.currentFrame): void {
    const n = clamp(0, index, this.state.history.length);
    this.state.history.length > n && this.state.currentFrame >= (this.state.history.length = n) && force(() => (this.state.currentFrame = n));
  }

  /** Resets timeline history, playhead, and initial snapshots to current reactor state. */
  public reset(): void {
    this.pause(), force(() => (this.state.currentFrame = this.state.history.length = 0));
    for (const [rid, rtr] of this.deps) this.state.initialState[rid] = this.getPayload(rtr, rid);
    this.timestamp = performance.now();
  }

  // ===========================================================================
  // THE TIME MACHINE (Manual Controls)
  // ===========================================================================
  /**
   * Instant state reconstruction (teleport) to a given history node index (frame).
   * Applies recorded nodes forward or backward until the playhead reaches `index`.
   * @param index Target history node index to jump to (clamped to bounds).
   * @param live If `true`, keep the paused shield active after applying.
   */
  public jumpTo(index: number = 0, live = false): void {
    this.state.paused = false;
    const target = clamp(0, index, this.state.history.length), // Ensure bounds
      forward = target > this.state.currentFrame;
    withMeta({ silent: true, temporal: `${forward ? "forward" : "backward"}${live ? "-live" : ""}` as const }, () => {
      while (this.state.currentFrame !== target) {
        let node = this.state.history[forward ? this.state.currentFrame : this.state.currentFrame - 1], // Grab the correct node (Current unapplied node if going forward, previous applied node if going backward)
          res = this.config.beforeApply?.(node, this.state.history, forward); // the power to edit history as it re-enacts
        res !== false && this.apply(res && res !== true ? res : node, forward); // 2. Apply the node's mutations to the reactor(s)
        forward ? this.state.currentFrame++ : this.state.currentFrame--; // 3. Move the playhead
      } // Glide until the playhead locks exactly onto the target
    });
    for (const rtr of this.deps.values()) rtr.tick(); // Batch Flush: Flush ALL teleportation ripples before dropping the shield!
    if (!live) this.state.paused = true;
  }
  /** Re-enacting a node that represents a point in time be it a transaction of transactions or a solitary mutation. */
  protected apply(node: HistoryNode<T, P>, forward = true): void {
    if ("nodes" in node) for (let len = node.nodes.length, i = forward ? 0 : len - 1; forward ? i < len : i >= 0; forward ? i++ : i--) this.apply(node.nodes[i], forward);
    else {
      const rtr = this.deps.get(node.rid) || this.deps.values().next().value!, // owner of the node index for (single||multi)-reactor management
        path = (!this.config.mirrorWrites ? node.path : mirror(node.path, rtr.core, false)) as any;
      (forward ? node.type === "delete" : node.hadKey === false) ? deletePath(rtr.core, path) : setPath(rtr.core, path, deepClone(forward ? node.to : node.from, rtr.config));
    }
  }

  /**
   * Step through time by a number of nodes.
   * @param stride Number of nodes to move the playhead by.
   * @param forward Direction: `true` for forward, `false` for backward.
   */
  public step(stride = 1, forward = true): void {
    if (forward ? this.state.currentFrame >= this.state.history.length : this.state.currentFrame <= 0) return; // Already at the edge of the timeline
    this.pause(), forward ? this.jumpTo(this.state.currentFrame + stride) : this.jumpTo(this.state.currentFrame - stride);
  }
  /** Returns `true` if there is history to step back into. */
  public get canUndo(): boolean {
    return this.state.currentFrame > 0;
  }
  /**
   * Step back in time (undo).
   * @param stride Optional `number` of nodes to undo.
   */
  public undo(stride?: unknown): void {
    this.step(arguments.length && "number" === typeof stride ? stride : 1, false);
  }
  /** Returns `true` if there is a future to step forward into. */
  public get canRedo(): boolean {
    return this.state.currentFrame < this.state.history.length;
  }
  /**
   * Step forward in time (redo).
   * @param stride Optional `number` of nodes to redo.
   */
  public redo(stride?: unknown): void {
    this.step(arguments.length && "number" === typeof stride ? stride : 1, true);
  }

  // ===========================================================================
  // THE VCR (Automated Playback)
  // ===========================================================================
  /**
   * Core automove engine. Replays or rewinds the recorded history honoring recorded time gaps.
   * @param forward Direction of playback: `true` to play forward, `false` to rewind.
   * @returns Promise<void> Resolves when playback completes or is paused/stopped.
   */
  public async automove(forward = true): Promise<void> {
    const seq = ++this.playSeq;
    this.state.paused = false;
    this.state.forward = forward;
    while (seq === this.playSeq && !this.state.paused && (forward ? this.state.currentFrame < this.state.history.length : this.state.currentFrame > 0)) {
      const dFrame = this.state.history[this.state.currentFrame + (forward ? 0 : -1)], // chronology
        delay = Math.min(("nodes" in dFrame ? dFrame.end - dFrame.start + dFrame.deltat : dFrame.deltat) / this.state.playbackRate, this.config.maxPlaybackDelay);
      if (delay > 0) await new Promise<void>((res) => setTimeout(res, delay, this.signal));
      !this.state.paused && this.jumpTo(this.state.currentFrame + (forward ? 1 : -1), true);
    }
    if (seq === this.playSeq) this.state.paused = true;
  }
  /**
   * Start chronological re-enactment of the session (play forward).
   * @returns Promise<void> Resolves when playback completes.
   */
  public play(): Promise<void> {
    return this.automove(true);
  }
  /**
   * Start reverse chronological re-enactment of the session (rewind).
   * @returns Promise<void> Resolves when rewind completes.
   */
  public rewind(): Promise<void> {
    return this.automove(false);
  }
  /** Pause any ongoing playback or rewinding. */
  public pause(): void {
    this.playSeq++, (this.state.paused = true);
  }

  // ===========================================================================
  // TELEMETRY & I/O (Session Import/Export)
  // ===========================================================================
  /**
   * Export the current time-travel session state as a JSON string.
   * @param replacer Optional replacer function used by `JSON.stringify`.
   * @param space Optional spacing parameter for pretty-printing.
   * @returns The serialized session JSON.
   */
  public export(replacer?: JSONReplacer, space?: string | number): string {
    return JSON.stringify(this.state, replacer as any, space);
  }
  /**
   * Import a serialized session JSON and reconstruct internal state and snapshots.
   * @param json The serialized session JSON produced by `export()`.
   * @param reviver Optional reviver function used by `JSON.parse`.
   */
  public import(json: string, reviver?: JSONReviver, start = this.state.currentFrame, resume = !this.state.paused, forward = this.state.forward): void {
    setPath(this.state, "*", JSON.parse(json, reviver) as TemporalState<T, P>);
    this.timestamp = performance.now();
    this.state.paused = false; // Shield import reconstruction from being recorded into history
    for (const [rid, rtr] of this.deps) {
      const paths = this.getPaths(rid);
      for (let i = 0, len = paths.length; i < len; i++) {
        const path = paths[i];
        fanout(rtr.core, path, getPath(this.state.initialState[rid], path) as any);
      }
    } // ticking after full revival for data accuracy
    for (const [rid, rtr] of this.deps) rtr.tick(this.config.whitelist ? this.getPaths(rid) : "*"); // Flush the genesis wave to the UI
    force(() => (this.state.currentFrame = 0)), this.jumpTo(start), resume && this.automove(forward); // Anchor at genesis before reconstructing target frame
  }
}

export type TemporalDirection = "forward" | "backward" | "forward-live" | "backward-live";
export type * from "./types";
export * from "./build";

declare module "@defs/reactor" {
  interface ReactorMeta {
    /** Direction and playback mode of temporal state mutations. */
    temporal?: TemporalDirection;
  }
}
