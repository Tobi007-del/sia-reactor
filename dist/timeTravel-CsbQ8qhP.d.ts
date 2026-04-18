import { P as Paths, e as PathValue, b as REvent, a as ReactorModuleId, M as ModulePaths, B as BaseReactorModule, R as Reactor } from './index-2jKy98op.js';

type JSONReplacer = ((this: any, key: string, value: any) => any) | (number | string)[] | null;
type JSONReviver = ((this: any, key: string, value: any) => any) | undefined;
interface StorageAdapterConfig {
    debug: boolean;
    /** Optional `JSON.stringify()` like replacer to be used where applicable. */
    replacer?: JSONReplacer;
    /** Optional `JSON.parse()` like reviver to be used where applicable. */
    reviver?: JSONReviver;
}
interface CookieOptions {
    /** Cookie path scope, defaults to root for maximum accessibility. */
    path: string;
    /** Optional cookie domain scope, e.g. ".example.com". */
    domain?: string;
    /** Cookie Secure attribute, defaults to `false` but should be `true` in production for HTTPS sites. */
    secure: boolean;
    /** Cookie SameSite attribute for CSRF protection, defaults to "Lax" for a balance of security and usability. */
    sameSite: "Strict" | "Lax" | "None";
    /** Optional cookie lifetime in seconds, e.g. 604800 for a week. */
    maxAge?: number;
    /** Optional absolute cookie expiry date, e.g. (new Date()).setDate(new Date().getDate() + 7), "Wed, 21 Oct 2023 07:28:00 GMT" (UTC Format). */
    expires?: string | Date;
}
interface CookieAdapterConfig extends StorageAdapterConfig, CookieOptions {
}
interface MemoryAdapterConfig extends StorageAdapterConfig {
    /** stored as strings to mimic local constraints */
    store: Map<string, string>;
}
interface IndexedDBAdapterConfig extends StorageAdapterConfig, IDBTransactionOptions {
    /** The name of the IndexedDB database to be created or retrieved. */
    dbName: string;
    /** Database version tag to use during creation or retrieval. */
    version: number;
    /** First store is default during operations if none is provided, i.e. ["VAULT", "TEMP"] -> clear(store = "VAULT") {} */
    stores: string[];
    /** return a preffered instance or `throw` to prevent accessing the database */
    onidb: () => any;
    /** Called when the database request needs to be upgraded */
    onupgradeneeded: (database: IDBDatabase, event: IDBVersionChangeEvent) => void;
    /** Called when the database version changes */
    onversionchange: (database: IDBDatabase, event: IDBVersionChangeEvent) => void;
    /** Called when the database request is successful */
    onsuccess: (database: IDBDatabase, event: Event) => void;
    /** Called when the database request fails */
    onerror: (error: DOMException | null, event: Event) => any;
    /** Called when the database request is blocked */
    onblocked: (event: IDBVersionChangeEvent) => void;
}
interface StorageAdapterConstructor<Config extends StorageAdapterConfig = StorageAdapterConfig> {
    new (config?: Config): StorageAdapter<Config>;
}
interface AsyncStorageAdapterConstructor<Config extends StorageAdapterConfig = StorageAdapterConfig> {
    new (config?: Config): AsyncStorageAdapter<Config>;
}
/**
 * Abstract base class for storage adapters, defines the interface and common functionality.
 * @typeParam Config Configuration object type for the adapter.
 */
declare abstract class BaseStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> {
    readonly name: string;
    config: Config;
    protected warn: (act?: string, mssg?: string, key?: string, store?: string) => false | void;
    constructor(config?: Config);
}
/**
 * Abstract base class for storage adapters, defines the interface and common functionality.
 * Extend this class to implement specific synchronous storage mechanisms (e.g., LocalStorage).
 * @typeParam Config Configuration object type for the adapter.
 */
declare abstract class StorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> extends BaseStorageAdapter<Config> {
    readonly name: string;
    abstract get(key: string): any;
    abstract set(key: string, value: any): boolean;
    abstract remove(key: string): boolean;
    abstract clear(): boolean;
}
/**
 * Abstract base class for asynchronous storage adapters, defines the interface and common functionality.
 * Extend this class to implement specific asynchronous storage mechanisms (e.g., IndexedDB).
 * @typeParam Config Configuration object type for the adapter.
 */
declare abstract class AsyncStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> extends BaseStorageAdapter<Config> {
    readonly name: string;
    abstract get(key: string): Promise<any>;
    abstract set(key: string, value: any): Promise<boolean>;
    abstract remove(key: string): Promise<boolean>;
    abstract clear(): Promise<boolean>;
}
/**
 * - The LocalStorage Adapter (~5MB per origin, browser-dependent).
 * - Provides aN implementation of the `StorageAdapter` interface using the browser's `localStorage`.
 * Handles JSON serialization and deserialization, and includes error handling for unsupported environments.
 */
declare class LocalStorageAdapter extends StorageAdapter {
    readonly name: string;
    /**
     * Reads and parses a value from localStorage.
     * @param key Storage key.
     * @returns Parsed value, or `undefined` when missing/unreadable.
     */
    get(key: string, reviver?: JSONReviver): any;
    /**
     * Serializes and writes a value to localStorage.
     * @param key Storage key.
     * @param value Value to serialize.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key: string, value: any, replacer?: JSONReplacer | undefined): boolean;
    /**
     * Removes a single key from localStorage.
     * @param key Storage key.
     * @returns `true` when removal succeeds, else `false`.
     */
    remove(key: string): boolean;
    /**
     * Clears all localStorage entries for the current origin.
     * @returns `true` when clear succeeds, else `false`.
     */
    clear(): boolean;
}
/**
 * - The SessionStorage Adapter (~5MB per origin per tab, browser-dependent).
 * - Provides an implementation of the `StorageAdapter` interface using the browser's `sessionStorage`.
 * Handles JSON serialization and deserialization, and includes error handling for unsupported environments.
 */
declare class SessionStorageAdapter extends StorageAdapter {
    readonly name: string;
    /**
     * Reads and parses a value from sessionStorage.
     * @param key Storage key.
     * @returns Parsed value, or `undefined` when missing/unreadable.
     */
    get(key: string, reviver?: JSONReviver): any;
    /**
     * Serializes and writes a value to sessionStorage.
     * @param key Storage key.
     * @param value Value to serialize.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key: string, value: any, replacer?: JSONReplacer | undefined): boolean;
    /**
     * Removes a single key from sessionStorage.
     * @param key Storage key.
     * @returns `true` when removal succeeds, else `false`.
     */
    remove(key: string): boolean;
    /**
     * Clears all sessionStorage entries for the current tab session.
     * @returns `true` when clear succeeds, else `false`.
     */
    clear(): boolean;
}
/**
 * - The Memory Storage Adapter (RAM-bound; no fixed browser quota).
 * - Provides an implementation of the `StorageAdapter` interface using an in-memory `Map`.
 * Useful for testing or non-persistent storage needs, mimics the API and behavior of LocalStorage.
 */
declare class MemoryAdapter extends StorageAdapter<MemoryAdapterConfig> {
    readonly name: string;
    constructor(build?: Partial<MemoryAdapterConfig>);
    /**
     * Reads and parses a value from memory storage.
     * @param key Storage key.
     * @returns Parsed value, or `undefined` when missing/unreadable.
     */
    get(key: string, reviver?: JSONReviver): any;
    /**
     * Serializes and writes a value to memory storage.
     * @param key Storage key.
     * @param value Value to serialize.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key: string, value: any, replacer?: JSONReplacer | undefined): boolean;
    /**
     * Removes a single key from memory storage.
     * @param key Storage key.
     * @returns `true` when removal succeeds, else `false`.
     */
    remove(key: string): boolean;
    /**
     * Clears all entries from memory storage.
     * @returns `true` when clear succeeds, else `false`.
     */
    clear(): boolean;
}
/**
 * - The Cookie Storage Adapter (~4KB per cookie; practical total payload budget often ~30KB).
 * - Provides an implementation of the `StorageAdapter` interface using `document.cookie`.
 * Handles JSON serialization/deserialization and URL-safe key/value encoding.
 */
declare class CookieAdapter extends StorageAdapter<CookieAdapterConfig> {
    readonly name: string;
    protected deets: (opts?: Partial<CookieOptions>, _d?: string | undefined, _m?: number | undefined, _e?: string | Date | undefined) => string;
    constructor(build?: Partial<CookieAdapterConfig>);
    /**
     * Reads and parses a cookie visible to the current page scope.
     * @param key Cookie key.
     * @returns Parsed value, or `undefined` when missing/unreadable.
     */
    get(key: string, reviver?: JSONReviver): any;
    /**
     * Writes a cookie with optional per-call scope/lifetime overrides.
     * @param key Cookie key.
     * @param value Value to serialize.
     * @param opts Optional per-call cookie options.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key: string, value: any, opts?: Partial<CookieOptions>, replacer?: JSONReplacer | undefined): boolean;
    /**
     * Removes a cookie key using matching scope attributes.
     * @param key Cookie key.
     * @param opts Optional per-call scope overrides.
     * @returns `true` when removal succeeds, else `false`.
     */
    remove(key: string, opts?: Partial<CookieOptions>): boolean;
    /**
     * Attempts to remove all visible cookie keys for the given scope.
     * @param opts Optional per-call scope overrides.
     * @returns `true` when clear succeeds, else `false`.
     */
    clear(opts?: Partial<CookieOptions>): boolean;
}
/**
 * - The IndexedDB Adapter (quota-managed; typically tens of MB to GB).
 * - Provides an implementation of the `AsyncStorageAdapter` interface using the IndexedDB database.
 * Handles database connection management, object store setup, and includes error handling for unsupported environments and common issues, requires snapshots(non-proxies) for persistence.
 */
declare class IndexedDBAdapter extends AsyncStorageAdapter<IndexedDBAdapterConfig> {
    readonly name: string;
    protected db?: IDBDatabase;
    constructor(build?: Partial<IndexedDBAdapterConfig>);
    /**
     * Returns a connected IndexedDB instance, opening it when needed.
     * @returns Connected database handle.
     */
    idb(): Promise<IDBDatabase>;
    /**
     * Reads a value by key from an object store.
     * @param key Record key.
     * @param store Optional object-store override.
     * @returns Stored value, or `undefined` when missing/unreadable.
     */
    get(key: string, store?: string, options?: Partial<IDBTransactionOptions>): Promise<any>;
    /**
     * Writes a value by key into an object store.
     * @param key Record key.
     * @param value Value to store.
     * @param store Optional object-store override.
     * @returns `true` when write succeeds, else `false`.
     */
    set(key: string, value: any, store?: string, options?: Partial<IDBTransactionOptions>): Promise<boolean>;
    /**
     * Deletes a value by key from an object store.
     * @param key Record key.
     * @param store Optional object-store override.
     * @returns `true` when delete succeeds, else `false`.
     */
    remove(key: string, store?: string, options?: Partial<IDBTransactionOptions>): Promise<boolean>;
    /**
     * Clears one or more object stores.
     * @param stores Store name or list of store names to clear.
     * @returns `true` when all clears succeed, else `false`.
     */
    clear(stores?: string | string[], options?: Partial<IDBTransactionOptions>): Promise<boolean>;
}
declare const COOKIE_ADAPTER_BUILD: Partial<CookieAdapterConfig>;
declare const INDEXED_DB_ADAPTER_BUILD: Partial<IndexedDBAdapterConfig>;

/** The DNA of a specific moment in time, Records the 'Desire' (Intent) or the 'Fact' (State). */
interface HistoryEntry<T extends object = any, P extends Paths<T> = Paths<T>> {
    /** The surgical address in the Reactor */
    path: P;
    /** The data payload at that moment */
    value: PathValue<T, P>;
    /** The "Undo" antidote (Previous value), if applicable */
    oldValue: any;
    /**  Was it a 'set' or a 'delete' surgery? */
    type: REvent<any, P>["staticType"];
    /** Did the Power Line disapprove?; why? */
    rejected?: string;
    /** Did the key for the value exist on its parent object? */
    hadKey?: boolean;
    /** For chronological re-enactment */
    deltat: number;
    /** For multi-reactor management, identifies who the entry belongs to */
    rid: ReactorModuleId;
}
interface TimeTravelConfig<T extends object, P extends Paths<T> = Paths<T>> {
    /** Whitelist paths only, no need for "*"; instead don't pass anything.
     * - `P[]`: one shared path list for all attached reactors.
     * - `Record<string, P[]>`: per-reactor path lists keyed by module reactor id. If you don't pass ids in `.attach()`, use implicit index keys (`"0"`, `"1"`, ...). */
    whitelist: ModulePaths<P>;
    /** Exclude filter for recorded paths. Checked only during record events. */
    blacklist?: ModulePaths<P>;
    /** Maximum number of history entries to keep (Memory Cap), you lose replaying Sessions or the Genesis */
    maxHistoryLength: number;
    /** Max delay between events during playback (ms) */
    maxPlaybackDelay: number;
}
interface TimeTravelState<T extends object, P extends Paths<T> = Paths<T>> {
    /** The "Genesis" snapshot (Raw Data) */
    initialState: {
        [rid: ReactorModuleId]: any;
    };
    /** The "Timeline" of mutations (Chronological Log) */
    history: HistoryEntry<T, P>[];
    /** The manual playhead (Index in the Timeline) */
    currentFrame: number;
    /** Whether playback is currently paused (Automatic Replay) */
    paused: boolean;
}
/**
 * - The Flight Recorder (Black Box).
 * - Implements S.I.A. logic to allow playback, teleportation, redos and undos.
 * Allows history from single or multiple reactors to be recorded and replayed in a synchronized manner, even if they have different shapes.
 * If paired with async persistence, `use()` or `setup()` this module after hydration where applicable to avoid recording restore waves.
 */
declare class TimeTravelModule<T extends object = any, P extends Paths<T> = Paths<T>> extends BaseReactorModule<T, TimeTravelConfig<T, P>, TimeTravelState<T, P>> {
    static readonly moduleName: string;
    protected lastTimestamp: number;
    protected playbackTimeoutId: number;
    constructor(config?: Partial<TimeTravelConfig<T, P>>, rtr?: Reactor<T>);
    wire(): void;
    protected onAttach(rtr: Reactor<any>, rid: ReactorModuleId): void;
    protected handleWhitelist({ value: paths, oldValue: prevs }: REvent<TimeTravelConfig<T, P>, "whitelist">): void;
    /** Chronicling the lifecycle of the system, Captures the essence of every mutation wave that bubbles up. */
    protected record(e: REvent<any, P>, rid?: ReactorModuleId): void;
    /** Clears timeline history and resets playhead/genesis to the current reactor state. */
    clear(): void;
    /** Instant state reconstruction (Teleport). Glides through deltas natively. */
    jumpTo(index?: number, keepShield?: boolean): void;
    /** Step through time, Moves the playhead and teleports the state. */
    step(stride?: number, forward?: boolean): void;
    /** Step back in time, Moves the playhead backward and teleports the state. */
    undo: () => void;
    /** Step forward in time, Restores previously undone actions. */
    redo: () => void;
    /** Core automove engine. Replays or rewinds the "Story" by respecting time gaps. */
    automove(forward?: boolean): Promise<void>;
    /** Start chronological re-enactment of the session. */
    play: () => Promise<void>;
    /** Start reverse chronological re-enactment of the session. */
    rewind: () => Promise<void>;
    /** Pauses the live VCR playback. */
    pause: () => void;
    /** Exports the current session as a JSON string. */
    export(replacer?: JSONReplacer, space?: string | number): string;
    /** Imports a session from a JSON string, allowing you to replay or analyze past states. */
    import(json: string, reviver?: JSONReviver): void;
}
declare const TIME_TRAVEL_MODULE_BUILD: Partial<TimeTravelConfig<any>>;

export { AsyncStorageAdapter as A, BaseStorageAdapter as B, COOKIE_ADAPTER_BUILD as C, type HistoryEntry as H, INDEXED_DB_ADAPTER_BUILD as I, type JSONReplacer as J, LocalStorageAdapter as L, MemoryAdapter as M, StorageAdapter as S, TIME_TRAVEL_MODULE_BUILD as T, type StorageAdapterConstructor as a, type AsyncStorageAdapterConstructor as b, CookieAdapter as c, type CookieAdapterConfig as d, type CookieOptions as e, IndexedDBAdapter as f, type IndexedDBAdapterConfig as g, type JSONReviver as h, type MemoryAdapterConfig as i, SessionStorageAdapter as j, type StorageAdapterConfig as k, type TimeTravelConfig as l, TimeTravelModule as m, type TimeTravelState as n };
