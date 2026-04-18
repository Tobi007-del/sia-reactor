import type { Reactor } from "../core/reactor";
import { getReactor, type Reactive, reactive } from "../core/mixins";
import type { Paths } from "../types/obj";
import { isObj } from "../utils/obj";
import { guardMethod, guardAllMethods } from "../utils/methd";

export type ReactorModuleId = string | number;

export type ModulePaths<P extends string = string> = P[] | Partial<Record<string, P[]>>;
export interface ReactorModulePathConfig<T extends object, P extends Paths<T> = Paths<T>> {
  /** Whether the module is disabled and history cleared */
  disabled: boolean;
  /** Whitelist paths only, no need for "*"; instead don't pass anything.
   * - `P[]`: one shared path list for all attached reactors.
   * - `Record<string, P[]>`: per-reactor path lists keyed by module reactor id. If you don't pass ids in `.attach()`, use implicit index keys (`"0"`, `"1"`, ...). */
  whitelist: ModulePaths<P>;
  /** Exclude filter for save-trigger paths. Checked only during save events. */
  blacklist: ModulePaths<P>;
}

export interface ReactorModuleConstructor<P extends BaseReactorModule = BaseReactorModule, T extends object = any> {
  new (rtr: Reactor<T>, config: any): P;
  moduleName: string;
}

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
  protected ac = new AbortController();
  protected readonly signal = this.ac.signal;
  protected rtrs = new Map<ReactorModuleId, Reactor<any>>();
  protected rids = new WeakMap<Reactor<any>, ReactorModuleId>(); // for quick 0(1) lookups over iteration
  protected wired = false;
  /** The reactive configuration object for the module, manipulate to change behaviour. */
  public config!: Config extends object ? Reactive<Config> : Config;
  /** The reactive state object for the module, watch to see exposed lifecycle changes. */
  public readonly state!: State extends object ? Reactive<State> : State;

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
  public attach(target?: Reactor<any> | Reactive<any>, id: ReactorModuleId = this.rtrs.size) {
    const rtr = getReactor(target);
    if (!rtr || this.rtrs.has(id)) return this;
    return this.rids.set((this.rtrs.set(id, rtr), rtr), id), this.onAttach(rtr, id), this;
  }
  protected onAttach(_rtr: Reactor<any>, _rid?: ReactorModuleId): void {}
  protected attachPaths(rtr: Reactor<any>, rid: ReactorModuleId) {
    const paths = this.getPaths(this.config.whitelist, rid);
    for (let i = 0, len = paths.length; i < len; i++) !this.config.disabled ? rtr.on(paths[i], this.handlePath, { signal: this.signal }) : rtr.off(paths[i], this.handlePath);
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

  public destroy() {
    this.ac.abort();
    this.onDestroy?.();
  }
  protected onDestroy?(): void;

  protected handleWhitelist({ value: paths, oldValue: prevs }: any) {
    for (const [rid, rtr] of this.rtrs) {
      const prevPaths = this.getPaths(prevs, rid),
        newPaths = this.getPaths(paths, rid);
      for (let i = 0, len = prevPaths.length; i < len; i++) rtr.off(prevPaths[i], this.handlePath);
      for (let i = 0, len = newPaths.length; i < len; i++) !this.config.disabled && rtr.on(newPaths[i], this.handlePath, { signal: this.signal });
    }
  }
  private handlePath(e: any, rid = this.rids.get(e.reactor)!): void {
    if (this.config.blacklist) {
      const paths = this.getPaths(this.config.blacklist, rid);
      for (let i = 0, len = paths.length; i < len; i++) {
        const path = paths[i];
        if (e.path === path || e.path.startsWith(path + ".")) return;
      }
    }
    this.onPath(e, rid);
  }
  protected onPath(_e: any, _rid: ReactorModuleId): void {}

  /**
   * Path resolution utility for modules, provides automatic reactor id resolution for multi-reactor setups.
   * @param paths Paths to filter by, supports same formats as `ModulePaths`, will be resolved with the module's reactor id if applicable.
   * @param target Reactor or reactor id to resolve paths for when using per-reactor path lists`.
   * @returns Resolved paths array, defaults to `["*"]` if no paths are found using search criteria.
   */
  protected getPaths<P extends string = string>(paths?: ModulePaths<P>, target?: Reactor<any> | ReactorModuleId): P[] {
    const rid = "object" === typeof target ? this.rids.get(target) : target;
    return ((paths && (Array.isArray(paths) ? paths : paths[String(rid)])) ?? wpArr) as P[];
  }

  /**
   * Wraps a function with module-scoped error logging, every instance methods is already auto-wrapped with this.
   * Use this when creating functions dynamically (for example, before attaching an anonymous listener on the fly).
   * @example
   * window.addEventListener("resize", this.guard(() => this.syncLayout(true)), { signal: this.signal });
   */
  protected guard = <Fn extends Function>(fn: Fn) => {
    return guardMethod(fn, (e) => this.rtrs.values().next().value?.log(`[Reactor "${this.name}" Module] Error: ${e}`)); // treated as seperate log identities
  }; // `()=>{}`: needs to be bounded even before initialization
}

export const wpArr = ["*"] as any;
