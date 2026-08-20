import { BaseReactorModule, ReactorModuleId } from "../base";
import { StorageAdapter, LocalStorageAdapter, AsyncStorageAdapter, type StorageAdapterConstructor } from "./storage";
import { fanoutOptsArr, setPath, deletePath, getPath, fanout, mergeObjs, parseEvtOpts, hasPath } from "@utils/obj";
import { setTimeout } from "@utils/fn";
import { Reactor } from "@core/reactor";
import type { REvent } from "@defs/reactor";
import { NOOP } from "@core/consts";
import type { Paths } from "@defs/obj";
import { PersistConfig, PersistState } from "./types";
import { PERSIST_MODULE_BUILD } from "./build";

/**
 * - The Storage Manager.
 * - Configurable storage adapters for maximum flexibility (localStorage, sessionStorage, IndexedDB, cookies, custom server persisters, etc.)
 * Path-based persistence for fine-grained control over what gets persisted across single or multiple reactors, merges into a single serialized state tree.
 * With async adapters, listen to `state.hydrated` (preferably `once`) before the `setup` of modules that should ignore hydration waves; hydrates lazy attachments too.
 */
export class PersistModule<T extends object = any, P extends Paths<T> = Paths<T>> extends BaseReactorModule<T, PersistConfig<T, P>, PersistState> {
  public static readonly moduleName: string = "persist";
  public adapter!: StorageAdapter<T> | AsyncStorageAdapter<T>;
  protected readonly tickMap = new Map<ReactorModuleId, Array<string>>();
  protected cache: any = null;
  protected hydrateSeq = 0;
  protected persistSeq = 0;
  protected saveTimeoutId = 0;

  constructor(config?: Partial<PersistConfig<T, P>>, rtr?: Reactor<T>) {
    super(mergeObjs(PERSIST_MODULE_BUILD, config, rtr?.config) as PersistConfig<T, P>, rtr, { hydrated: false });
  }

  public override wire(): void {
    // Event Listeners
    "undefined" !== typeof window && window.addEventListener("pagehide", this.onDestroy, { signal: this.signal });
    "undefined" !== typeof document && document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && this.onDestroy(), { signal: this.signal });
    // Config Listeners
    this.config.on("adapter", this.handleAdapter, { signal: this.signal, init: true });
    this.config.on("disabled", this.handleDisabled, { signal: this.signal, init: true });
    this.config.on("whitelist", this.handleWhitelist, { signal: this.signal, init: true });
    this.config.on("synchronous", this.handleSynchronous, { signal: this.signal });
  }

  protected override onAttach(rtr: Reactor<any>, rid: ReactorModuleId): void {
    rtr.config.eventBubbling = true;
    this.attachPaths(rtr, rid);
    this.state.hydrated && this.cache && this.hydrate(this.deps.size > 1 ? getPath(this.cache, rid as any) : this.cache, rtr, rid);
  }

  protected override onPath(): void {
    if (this.state.hydrated) this.saveTimeoutId ||= setTimeout(this.persist, this.config.throttle, this.signal);
  }
  protected async persist(): Promise<void> {
    const seq = ++this.persistSeq;
    let payload: any = this.getPayload();
    if (this.config.beforeSave) {
      const res = this.config.beforeSave(payload);
      if (res === false) return; // blocking persist
      if (res && res !== true) payload = res;
    }
    this.saveTimeoutId = 0; // onto the next!
    if (this.config.onSave === NOOP) return void (await this.adapter.set(this.config.key, payload)); // always lazy, not the `MC`
    try {
      const bool = await this.adapter.set(this.config.key, payload);
      if (seq !== this.persistSeq) return; // you can show your loaders but we will not falter
      this.config.onSave(payload, bool ?? true); // base adapter returns bool and doesn't throw but "We still don't trust you"
    } catch (e) {
      this.config.onSave(payload, false, e); // `throwErrors: true` on adapter config or custom bypass?, here's your metadata
    }
  }

  protected async handleAdapter({ value = LocalStorageAdapter }: REvent<PersistConfig<T, P>, "adapter">) {
    const seq = ++this.hydrateSeq;
    if (this.adapter && value === this.adapter.constructor) return;
    this.state.hydrated = false;
    this.adapter?.remove(this.config.key); // Cleanup old adapter storage
    this.adapter = "function" === typeof value ? new (value as StorageAdapterConstructor)({ debug: !!this.deps.values().next().value?.canLog }) : ((value.config.debug = !!this.deps.values().next().value?.canLog), value); // dynamic, instance or not; pass am come :)
    try {
      let saved = this.adapter.get(this.config.key);
      const isAsync = saved instanceof Promise, // accuracy incase overriden methods are async
        opts = parseEvtOpts(this.config.fanout ?? isAsync, fanoutOptsArr, "depth");
      saved = (!isAsync ? saved : await saved) as T;
      if (this.config.beforeHydrate && saved) {
        const res = this.config.beforeHydrate(saved);
        if (res === false) return; // block hydration entirely
        if (res && res !== true) saved = res;
      }
      if (seq !== this.hydrateSeq || !saved) return;
      this.cache = this.config.cachePayload ? saved : null;
      for (const [rid, rtr] of this.deps) this.hydrate(this.deps.size > 1 ? getPath(saved, rid as any) : saved, rtr, rid, opts, false); // allows retrieving with path-like ids, ticking after full revival for data accuracy
      for (const [rid, rtr] of this.deps) rtr.tick(opts.depth || !this.config.whitelist ? "*" : this.tickMap.get(rid) || []);
      this.tickMap.clear(); // faster than sequential delete
    } finally {
      if (seq === this.hydrateSeq) this.state.hydrated = true;
    }
  }

  protected handleDisabled({ value }: REvent<PersistConfig<T, P>, "disabled">) {
    for (const [rid, rtr] of this.deps) this.attachPaths(rtr, rid);
    value && this.adapter?.remove(this.config.key);
  }

  protected hydrate(entry: any, rtr: Reactor<any>, rid: ReactorModuleId = this.rids.get(rtr)!, { depth, merge = true, atomic, skipUndef } = parseEvtOpts(this.config.fanout, fanoutOptsArr, "depth"), tick = true): void {
    if (!entry) return;
    const whites = this.getPaths(rid),
      blacks = this.getPaths(rid, this.config.blacklist, true),
      set = (p: any, curr: any, prev: any) => (depth ? (fanout as any) : setPath)(rtr.core, p, merge ? mergeObjs(curr, prev, rtr.config) : prev, depth ? { depth, atomic, skipUndef, crossRealms: rtr.config.crossRealms } : undefined); // if sync, merge directly, else fanout for granularity
    let ticks = this.tickMap.get(rid);
    for (let i = 0, len = blacks.length; i < len; i++) deletePath(entry, blacks[i]);
    for (let i = 0, len = whites.length; i < len; i++) {
      let mirror: string | undefined;
      const _path = whites[i],
        path = (!this.config.mirrorWrites || !_path.includes("state") || !hasPath(rtr.core, (mirror = _path.replace("state", "intent"))) ? _path : mirror) as any,
        value = getPath(entry, _path);
      value !== undefined && (set(path, getPath(rtr.core, path), value), (ticks || (this.tickMap.set(rid, (ticks = [])), ticks)).push(path));
    }
    tick && (rtr.tick(depth || !this.config.whitelist ? "*" : ticks || []), this.tickMap.delete(rid));
  }

  /** Clears persisted payload for this module instance by removing the stored key from the adapter and drops any pending save. */
  public clear(): void {
    clearTimeout(this.saveTimeoutId);
    this.saveTimeoutId = -1; // ignore all writes until next microtask
    queueMicrotask(() => (this.saveTimeoutId = 0)); // hack to delay saves till next tick
    this.adapter?.remove(this.config.key);
  }
  /** Clears stored `cache` for this module instance, call after all attachments that use the cached hydration payload. */
  public clearCache(): void {
    this.cache = null;
  }

  protected onDestroy(): void {
    this.config.strict && this.state.hydrated && !this.config.disabled && this.adapter?.set(this.config.key, this.getPayload()); // One last save before the lights go out
  }
}

export type * from "./types";
export * from "./build";
