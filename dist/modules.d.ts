import { P as Paths, M as ModulePaths, I as Inert, F as FanoutTuple, B as BaseReactorModule, R as Reactor, a as ReactorModuleId, b as REvent } from './index-2jKy98op.js';
export { c as ReactorModuleConstructor } from './index-2jKy98op.js';
import { S as StorageAdapter, A as AsyncStorageAdapter, a as StorageAdapterConstructor, b as AsyncStorageAdapterConstructor } from './timeTravel-CsbQ8qhP.js';
export { B as BaseStorageAdapter, C as COOKIE_ADAPTER_BUILD, c as CookieAdapter, d as CookieAdapterConfig, e as CookieOptions, H as HistoryEntry, I as INDEXED_DB_ADAPTER_BUILD, f as IndexedDBAdapter, g as IndexedDBAdapterConfig, J as JSONReplacer, h as JSONReviver, L as LocalStorageAdapter, M as MemoryAdapter, i as MemoryAdapterConfig, j as SessionStorageAdapter, k as StorageAdapterConfig, T as TIME_TRAVEL_MODULE_BUILD, l as TimeTravelConfig, m as TimeTravelModule, n as TimeTravelState } from './timeTravel-CsbQ8qhP.js';

interface PersistConfig<T extends object, P extends Paths<T> = Paths<T>> {
    /** Whether the persistence is disabled and cleared */
    disabled: boolean;
    /** The key under which to store the persisted data */
    key: string;
    /** Whitelist paths only, no need for "*"; instead don't pass anything.
     * - `P[]`: one shared path list for all attached reactors.
     * - `Record<string, P[]>`: per-reactor path lists keyed by module reactor id. If you don't pass ids in `.attach()`, use implicit index keys (`"0"`, `"1"`, ...). */
    whitelist: ModulePaths<P>;
    /** Exclude filter for save-trigger paths. Checked only during save events. */
    blacklist?: ModulePaths<P>;
    /** Storage adapter class or instance to use, can satisfy `instanceof` or just definition, cast to `any` if the latter */
    adapter: Inert<StorageAdapter> | Inert<AsyncStorageAdapter> | Inert<StorageAdapterConstructor> | Inert<AsyncStorageAdapterConstructor>;
    /** Throttle time for saving changes */
    throttle: number;
    /** Fan out restored hydration writes so listeners/effects catch up, defaults to `true` if async for predictability */
    fanout: boolean | FanoutTuple;
    /** - `false`: persist live proxied roots (fastest, adapter must handle proxies).
     * - `true`,`"auto"`: persist via `Reactor.snapshot()` but `true` force-enables `Reactor.config.referenceTracking`+`Reactor.config.smartCloning` for better performance. */
    useSnapshot: boolean | "auto";
}
interface PersistState {
    /** Whether the persisted data has been loaded. */
    hydrated: boolean;
}
/**
 * - The Storage Manager.
 * - Configurable storage adapters for maximum flexibility (localStorage, sessionStorage, IndexedDB, cookies, custom server persisters, etc.)
 * Path-based persistence for fine-grained control over what gets persisted across single or multiple reactors, merges into a single serialized state tree.
 * When using async adapters, listen to `state.hydrated` (preferably `once`) before the setup of modules that should ignore hydration waves.
 */
declare class PersistModule<T extends object = any, P extends Paths<T> = Paths<T>> extends BaseReactorModule<T, PersistConfig<T, P>, PersistState> {
    static readonly moduleName: string;
    adapter: StorageAdapter | AsyncStorageAdapter;
    protected hydrateSeq: number;
    protected saveTimeoutId: number;
    get payload(): Record<string, any> | undefined;
    constructor(config?: Partial<PersistConfig<T, P>>, rtr?: Reactor<T>);
    wire(): void;
    protected onAttach(rtr: Reactor<any>, rid: ReactorModuleId): void;
    protected handleAdapter({ value }: REvent<PersistConfig<T, P>, "adapter">): Promise<void>;
    protected handleDisabled({ value }: REvent<PersistConfig<T, P>, "disabled">): void;
    protected handleWhitelist({ value: paths, oldValue: prevs }: REvent<PersistConfig<T, P>, "whitelist">): void;
    protected save(e: REvent<any, P>): void;
    /** Clears persisted payload for this module instance and drops any pending save. */
    clear(): void;
    protected onDestroy(): void;
}
declare const PERSIST_MODULE_BUILD: Partial<PersistConfig<any>>;

export { AsyncStorageAdapter, AsyncStorageAdapterConstructor, BaseReactorModule, ModulePaths, PERSIST_MODULE_BUILD, type PersistConfig, PersistModule, ReactorModuleId, StorageAdapter, StorageAdapterConstructor };
