import type { Reactor } from "@core/reactor";
import { getReactor, type Reactive, reactive } from "@core/mixins";
import { isObj, matchPaths, getPath, setPath, nuke } from "@utils/obj";
import { guardMethod, guardAllMethods } from "@utils/methd";
import { ReactorModulePathConfig, ReactorModuleConstructor, ReactorModuleId, ModulePaths } from "./types";

/**
 * Base class, extend to create custom reactor modules that can be used with a `Reactor` instance
 * Provides common functionalities like multi-reactor management, configuration handling, and error logging.
 * @typeParam T Root state object type of the reactors this module will manage.
 * @typeParam Config Configuration object type for the module.
 * @typeParam State Optional local state object type for the module.
 */
export abstract class BaseReactorModule<T extends object = any, Config extends Partial<ReactorModulePathConfig<T>> = any, State = any> {
  public static readonly moduleName: string;
  public get name() {
    return (this.constructor as ReactorModuleConstructor).moduleName;
  }
  protected readonly ac = new AbortController();
  protected readonly signal = this.ac.signal;
  public readonly deps = new Map<ReactorModuleId, Reactor<any>>();
  public readonly rids = new WeakMap<Reactor<any>, ReactorModuleId>(); // for quick 0(1) lookups over iteration
  public readonly evtOpts = { signal: this.signal };
  /** The reactive state object for the module, watch to see exposed lifecycle changes. */
  public readonly state!: State extends object ? Reactive<State> : State;
  /** The reactive configuration object for the module, manipulate to change behaviour. */
  public config!: Config extends object ? Reactive<Config> : Config;
  public wired = false;
  private readonly clups = new Map<ReactorModuleId, (() => void)[]>();

  constructor(config?: Config, rtr?: Reactor<T>, state?: State) {
    guardAllMethods(this, this.guard); // Modules can sacrifice memory footprint for error proofing and events devx
    this.config = (isObj(config) ? reactive(config) : config) as BaseReactorModule["config"];
    this.state = (isObj(state) ? reactive(state) : state) as BaseReactorModule["state"];
    rtr && this.attach(rtr); // User don't have to pass rtr at instantion except config options need type inference from `T`
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
  public attach(target?: Reactor<any> | Reactive<any>, id: ReactorModuleId = this.deps.size) {
    const rtr = getReactor(target);
    if (!rtr || this.deps.has(id)) return this;
    return this.rids.set((this.deps.set(id, rtr), rtr), id), this.onAttach(rtr, id), this;
  }
  protected onAttach(_rtr: Reactor<any>, _rid?: ReactorModuleId): void {}
  protected attachPaths(rtr: Reactor<any>, rid: ReactorModuleId, paths = this.getPaths(rid)) {
    let clups = this.clups.get(rid);
    if (!clups) this.clups.set(rid, (clups = []));
    for (let i = 0, len = paths.length; i < len; i++) {
      const path = paths[i];
      !this.config.disabled ? clups.push(this.config.synchronous ? rtr.watch(path, this.handlePathSync, { signal: this.signal }) : rtr.on(path, this.handlePath, this.evtOpts)) : this.config.synchronous ? rtr.nowatch(path, this.handlePathSync) : rtr.off(path, this.handlePath, this.evtOpts);
    }
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
  public setup(target?: Reactor<any> | Reactive<any>, id?: ReactorModuleId): this {
    return this.attach(target, id), !this.wired && (this.wire(), (this.wired = true)), this;
  }
  /** set up listeners/subscriptions and module runtime wiring. */
  public abstract wire(): void;

  public destroy(): void {
    if (this.ac) this.ac.abort(), this.onDestroy?.(), nuke(this); // only one rtr can kill; nuke is notorious
  }
  protected onDestroy?(): void;

  /**
   * Wraps a function with module-scoped error logging, every instance methods is already auto-wrapped with this.
   * Use this when creating functions dynamically (for example, before attaching an anonymous listener on the fly).
   * @example
   * window.addEventListener("resize", this.guard(() => this.syncLayout(true)), { signal: this.signal });
   */
  protected guard = <Fn extends Function>(fn: Fn) => {
    return guardMethod(fn, (e) => this.deps.values().next().value?.log(`[Reactor "${this.name}" Module] Error: ${e}`)); // treated as seperate log identities
  }; // `()=>{}`: needs to be bounded even before initialization

  protected handleWhitelist({ currentTarget: { value: paths } }: any): void {
    for (const [rid, rtr] of this.deps) this.cleanup(rid), this.attachPaths(rtr, rid, this.getPaths(rid, paths));
  } // child wires when ready
  private handlePath(e: any, rid = this.rids.get(e.reactor)!): void {
    (!this.config.blacklist || !matchPaths(this.getPaths(rid, this.config.blacklist, true), e.path)) && this.onPath(e, rid);
  }
  private handlePathSync = (_: any, p: any) => this.handlePath(p);
  protected onPath(_e: any, _rid: ReactorModuleId): void {}

  protected handleSynchronous() {
    for (const [rid, rtr] of this.deps) this.cleanup(rid), this.attachPaths(rtr, rid);
  } // child wires when ready

  private cleanup(rid: ReactorModuleId): void {
    const clups = this.clups.get(rid);
    if (clups) for (let i = 0, len = clups.length; i < len; i++) clups[i]();
    clups && (clups.length = 0);
  }

  /**
   * Path resolution utility for modules, provides automatic reactor id resolution for multi-reactor setups.
   * @param target Reactor or reactor id to resolve paths for when using per-reactor path lists`.
   * @param paths Paths to filter by, supports same formats as `ModulePaths`, will be resolved with the module's reactor id if applicable.
   * @returns Resolved paths array, defaults to `["*"]` if no paths are found using search criteria.
   */
  public getPaths<P extends string = string>(target?: Reactor<any> | ReactorModuleId, paths = this.config.whitelist as ModulePaths<P>, allowEmpty = paths !== this.config.whitelist): P[] {
    const rid = (target as any)?.core ? this.rids.get(target as Reactor<any>) : target;
    return ((paths && (Array.isArray(paths) ? paths : paths[String(rid)])) ?? (!allowEmpty ? wpArr : [])) as P[];
  }

  /**
   * Compute the serialized payload for all attached reactors.
   * If multiple reactors are attached, returns a merged object keyed by reactor id. Honors `whitelist`, `snapshot` and `mirrorWrites` configuration on each reactor.
   * @param target Optional target reactor or id to compute payload for, useful when using per-reactor path lists.
   * @returns The payload to persist (or `undefined` for empty single-reactor payload).
   */
  public getPayload(target?: Reactor<any> | ReactorModuleId, _rid?: ReactorModuleId, _nest = target ? false : this.deps.size > 1): any {
    const _rtr = (target as any)?.core ? (target as Reactor<any>) : this.deps.get(target as ReactorModuleId)!;
    let res: Record<string, any> | undefined = _nest ? {} : undefined;
    for (const [rid, rtr] of !target ? this.deps : [[_rid || target, _rtr] as const]) {
      const snap = this.config.snapshot ? (this.config.snapshot === true && (rtr.config.referenceTracking = rtr.config.smartCloning = true), rtr.snapshot()) : rtr.core,
        val: any = this.config.whitelist ? {} : snap;
      if (this.config.whitelist) {
        const paths = this.getPaths(rid);
        for (let i = 0, len = paths.length; i < len; i++) {
          const _path = paths[i],
            path = (!this.config.mirrorReads || !_path.includes("intent") ? _path : _path.replace("intent", "state")) as any;
          setPath(val, _path, getPath(snap, path));
        }
      }
      _nest ? setPath(res!, rid as any, val) : (res = val); // allows merging with path-like ids
    }
    return res;
  }
}

export const wpArr = ["*"] as any;
export type * from "./types";
