type Primitive = string | number | boolean | bigint | symbol | null | undefined;
type NoTraverse =
  | Inert<unknown>
  | Primitive
  | Function
  | Date
  | Error
  | RegExp
  | Promise<any>
  | Map<any, any>
  | WeakMap<any, any>
  | Set<any>
  | WeakSet<any>
  | EventTarget; // Covers Window, Document, Node, Element, etc.

/** Dot-path union for traversable keys in `T` up to depth `D{11}`. */
type Paths<T, S extends string = ".", D extends number = MaxDepth> = [D] extends [0]
  ? never // Circuit Breaker Triggered
  : T extends NoTraverse
  ? never
  : T extends readonly (infer U)[]
  ? `${Extract<keyof T, number>}` | `${Extract<keyof T, number>}${S}${Paths<U, S, PrevDepth[D]>}` // or just `${number}`
  : {
      [K in keyof T & (string | number)]: T[K] extends Primitive
        ? `${K}`
        : `${K}` | `${K}${S}${Paths<T[K], S, PrevDepth[D]>}`;
    }[keyof T & (string | number)];
/** Wildcard path (`*`) or concrete dot-path. */
type WildPaths<T, S extends string = "."> = "*" | Paths<T, S>;
/** Child-path expansion for a path up to relative depth `D{x}`. */
type ChildPaths<
  T,
  P extends WildPaths<T>,
  S extends string = ".",
  D extends number = MaxDepth
> = Extract<
  Paths<T, S, AddDepth<PathDepth<P, S>, D>>,
  `${P extends "*" ? "" : P}${P extends "*" ? "" : S}${string}`
> &
  Paths<T, S>; // bundlers can shutup and just believe

/** Leaf key name extracted from a path. */
type PathKey<T, P extends string = Paths<T>, S extends string = "."> = P extends "*"
  ? keyof T & (string | number) // Or: DeepKeys<T>
  : PathLeaf<P, S>; // Loose since reactor just slices strings
/** Strict leaf key validated against actual object structure. */
type StrictPathKey<T, P extends string = Paths<T>, S extends string = "."> = P extends "*"
  ? keyof T & (string | number) // Or: DeepKeys<T>
  : P extends `${infer K}${S}${infer Rest}`
  ? K extends keyof T
    ? StrictPathKey<T[K], Rest, S>
    : never
  : P extends keyof T
  ? P
  : never;

/** Value type at path `P` in `T`. */
type PathValue<T, P extends string = Paths<T>, S extends string = "."> = P extends "*"
  ? any // Or: DeepValues<T>
  : P extends `${infer K}${S}${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest, S>
    : never
  : P extends keyof T
  ? T[P]
  : never;

/** Parent-branch value type for path `P` in `T`. */
type PathBranchValue<T, P extends string = Paths<T>, S extends string = "."> = P extends "*"
  ? any // Or: DeepValues<T>
  : P extends `${string}${S}${string}`
  ? PathValue<T, PathBranch<P, S>, S>
  : T;

/** Converts flattened dotted-key objects into nested object with preserved value types. */
type Unflatten<T extends object, S extends string = "."> = UnionToIntersection<
  {
    [K in keyof T & string]: UnflattenKey<K, T[K], S>;
  }[keyof T & string]
>;
type UnflattenKey<
  K extends string,
  V,
  S extends string
> = K extends `${infer Head}${S}${infer Tail}`
  ? { [P in Head]: UnflattenKey<Tail, V, S> }
  : { [P in K]: V };

// --- Helpers ---

/** Calculates the depth of a dot-separated path with a max of D{11}. */
type PathDepth<
  P extends string,
  S extends string = ".",
  D extends number = MaxDepth
> = P extends "*"
  ? 0
  : [D] extends [0]
  ? 0
  : P extends `${infer _}${S}${infer Rest}`
  ? NextDepth[PathDepth<Rest, S, PrevDepth[D]>]
  : 1;

/** Last segment of a path. */
type PathLeaf<
  P extends string,
  S extends string = "."
> = P extends `${infer _Head}${S}${infer Tail}` ? PathLeaf<Tail, S> : P;

/** Path without its last segment. */
type PathBranch<
  P extends string,
  S extends string = "."
> = P extends `${infer Head}${S}${infer Tail}`
  ? Tail extends `${string}${S}${string}`
    ? `${Head}${S}${PathBranch<Tail, S>}`
    : Head
  : never;

/** Converts a union of types into an intersection of types. */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

/** Adds two depths together, respecting the max depth{11}. */
type AddDepth<A extends number, B extends number> = [B] extends [0]
  ? A
  : [A] extends [MaxDepth]
  ? MaxDepth
  : AddDepth<NextDepth[A], PrevDepth[B]>;

/** Subtracts depth B from A, respecting the min depth{0}. */
type SubtractDepth<A extends number, B extends number> = [B] extends [0]
  ? A
  : [A] extends [0]
  ? 0
  : SubtractDepth<PrevDepth[A], PrevDepth[B]>;

// --- "It's not that deep" WARRIORS ---

/** Deep key union of `T` up to depth `D{11}`. */
type DeepKeys<T, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T extends NoTraverse
  ? never
  : T extends readonly any[]
  ? DeepKeys<T[number], PrevDepth[D]>
  : {
      [K in keyof T & (string | number)]: K | DeepKeys<T[K], PrevDepth[D]>;
    }[keyof T & (string | number)];

/** Recursive merge result type for `T1` and `T2` up to depth `D{11}`. */
type DeepMerge<T1, T2, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T1 extends NoTraverse
  ? T2
  : T2 extends NoTraverse
  ? T2
  : T2 extends object
  ? T1 extends object
    ? {
        [K in keyof T1 | keyof T2]: K extends keyof T2
          ? K extends keyof T1
            ? DeepMerge<T1[K], T2[K], PrevDepth[D]>
            : T2[K]
          : K extends keyof T1
          ? T1[K]
          : never;
      }
    : T2
  : T2;

/** Recursive partial type up to depth `D{11}`. */
type DeepPartial<T, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T extends NoTraverse
  ? T
  : T extends Array<infer U>
  ? Array<DeepPartial<U, PrevDepth[D]>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U, PrevDepth[D]>>
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P], PrevDepth[D]> }
  : T;

/** Recursive required type up to depth `D{11}`. */
type DeepRequired<T, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T extends NoTraverse
  ? T
  : T extends Array<infer U>
  ? Array<DeepRequired<U, PrevDepth[D]>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepRequired<U, PrevDepth[D]>>
  : T extends object
  ? { [P in keyof T]-?: DeepRequired<T[P], PrevDepth[D]> }
  : T;

/** Recursive readonly type up to depth `D{11}`. */
type DeepReadonly<T, D extends number = MaxDepth> = [D] extends [0]
  ? never
  : T extends NoTraverse
  ? T
  : T extends Array<infer U>
  ? ReadonlyArray<DeepReadonly<U, PrevDepth[D]>>
  : T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P], PrevDepth[D]> }
  : T;

// --- RECURSION LIMITERS ---

/** Config for defining recursive limits for all parts of the application */
interface DepthConfig {
  max: 11; // 19 is observed bundler recursive limit for state trees so, raise amm!!!
  prev: [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  next: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
}
/** Current recursive depth limit */
type MaxDepth = DepthConfig["max"];
type PrevDepth = DepthConfig["prev"];
type NextDepth = DepthConfig["next"];

/**
 * - Runtime event payload used by Reactor listener waves.
 * - Tracks phase and current path context during propagation, mimics native `Event` API.
 * Exposes intent controls (`resolve`/`reject`), propagation controls, and `composedPath()`.
 * @typeParam T Root state object type.
 * @typeParam P Target path type.
 */
declare class ReactorEvent<T extends object, P extends WildPaths<T> = WildPaths<T>> {
    /** No active propagation phase. */
    static readonly NONE = 0;
    /** Capture phase: root to target parent. */
    static readonly CAPTURING_PHASE = 1;
    /** Target phase: target listeners run. */
    static readonly AT_TARGET = 2;
    /** Bubble phase: target parent to root. */
    static readonly BUBBLING_PHASE = 3;
    /** Current propagation phase for this event instance. */
    eventPhase: number;
    /** Current event type for the active propagation path, clone immediately if async */
    type: Payload<T, P>["type"];
    /**
     * Current target context for the active propagation path, clone immediately if async.
     * Also use to survive future object shape changes from nesting for a path callback.
     */
    currentTarget: Payload<T, P>["currentTarget"];
    /** Original event type before propagation remapping. */
    readonly staticType: Exclude<Payload<T, P>["type"], "update">;
    /** Original event target context. */
    readonly target: Payload<T, P>["target"];
    /** Root reactive object for this event instance wave. */
    readonly root: Payload<T, P>["root"];
    /** Original target path for this event instance wave. */
    readonly path: Payload<T, P>["target"]["path"];
    /** Current value at the event target path. */
    readonly value: Payload<T, P>["target"]["value"];
    /** Previous value at the event target path. */
    readonly oldValue: Payload<T, P>["target"]["oldValue"];
    /** Whether resolve/reject intent semantics are allowed for this event instance. */
    readonly rejectable: boolean;
    /** Whether this event instance wave can bubble back up to ancestors or just capture down. */
    readonly bubbles: boolean;
    /**
     * `DOMHighResTimeStamp` for this event instance payload for native event parity and accuracy.
     * Enable `eventTimeStamps` option, then use this over custom timestamps in listeners for accuracy.
     * */
    readonly timestamp?: number;
    /** The `Reactor` instance that dispatched this event instance. */
    readonly reactor: Reactor<T>;
    protected _resolved: string;
    protected _rejected: string;
    protected _propagationStopped: boolean;
    protected _immediatePropagationStopped: boolean;
    /**
     * @param payload Source payload for this event instance.
     * @param reactor The `Reactor` instance creating this event instance.
     */
    constructor(payload: Payload<T, P>, reactor: Reactor<T>);
    /** Whether propagation has been stopped. */
    get propagationStopped(): boolean;
    /** Stops propagation to remaining listeners in later nodes/phases. */
    stopPropagation(): void;
    /** Whether immediate propagation has been stopped. */
    get immediatePropagationStopped(): boolean;
    /** Stops propagation immediately, including remaining listeners on current path. */
    stopImmediatePropagation(): void;
    /** Resolution message for rejectable events. */
    get resolved(): string;
    /**
     * Marks a rejectable event as resolved.
     * @param message Optional resolution message or identity.
     * @example e.resolve("html5Tech"); // identity
     * @example e.resolve("API Load successful"); // message
     */
    resolve(message?: string): void;
    /** Rejection reason for rejectable events. */
    get rejected(): string;
    /**
     * Marks a rejectable event as rejected.
     * @param reason Optional rejection reason or identity.
     * @example e.resolve("html5Tech"); // identity
     * @example e.resolve("User is not logged in"); // reason
     */
    reject(reason?: string): void;
    /**
     * Returns event path values from target to root.
     * @returns Composed path values in bubbling order.
     */
    composedPath(): any[];
}

/** Reactor method names exposed on objects returned by {@link reactive}. */
declare const methods: readonly ["tick", "stall", "nostall", "get", "gonce", "noget", "set", "sonce", "noset", "delete", "donce", "nodelete", "watch", "wonce", "nowatch", "on", "once", "off", "snapshot", "use", "reset", "destroy"];
type Method = (typeof methods)[number];
type Prefix<P extends ReactivePreferences | undefined> = P extends {
    prefix?: infer X extends string;
} ? X : "";
type Suffix<P extends ReactivePreferences | undefined> = P extends {
    suffix?: infer X extends string;
} ? X : "";
type Whitelist<P extends ReactivePreferences | undefined> = P extends {
    whitelist?: infer W extends readonly Method[];
} ? W[number] : never;
type ReactiveMethodMap<T extends object, P extends ReactivePreferences | undefined> = {
    [K in Method as [Prefix<P>, Suffix<P>] extends ["", ""] ? (P extends {
        whitelist: readonly Method[];
    } ? (K extends Whitelist<P> ? never : K) : K) : P extends {
        whitelist: readonly Method[];
    } ? (K extends Whitelist<P> ? `${Prefix<P>}${K}${Suffix<P>}` : K) : `${Prefix<P>}${K}${Suffix<P>}`]: Pick<Reactor<T>, Method>[K];
};
interface ReactivePreferences {
    /** Prefix applied to exposed reactor methods. */
    prefix?: string;
    /** Suffix applied to exposed reactor methods. */
    suffix?: string;
    /** Methods that should keep their original names when affixes are used. */
    whitelist?: readonly Method[];
}
type Reactive<T extends object, P extends ReactivePreferences | undefined = undefined> = T & ReactiveMethodMap<T, P> & {
    __Reactor__: Reactor<T>;
};
/**
 * Attaches `Reactor` APIs to a state object and returns its reactive proxy from the reactor's core.
 * If an existing `reactive()` object is passed, it is re-returned ignoring change in preferences.
 * @param target Source state object or an existing Reactor instance.
 * @param build Reactor initial configuration.
 * @param preferences Method naming preferences for exposed APIs.
 * @returns Reactive object with mapped Reactor methods and `__Reactor__`.
 * @example
 * const state = reactive({ user: { name: "Kosi" } });
 * state.set("user.name", (v) => v);
 * @example
 * const rtr = new Reactor({ count: 0 });
 * const state = reactive(rtr);
 */
declare function reactive<T extends object, const P extends ReactivePreferences | undefined = undefined>(target: T, build?: ReactorBuild<T>, preferences?: P): T extends Reactive<infer O, infer P> ? T : Reactive<T, P>;
/**
 * Marks an object as intent (rejectable).
 * @param target Object to mark.
 * @returns The same object with intent typing.
 */
declare function intent<T extends object>(target: T): Intent<T>;
/**
 * Removes intent (rejectable) behavior from an object.
 * @param target Object to unmark.
 * @returns The same object with state typing.
 */
declare function state<T extends object>(target: T): State<T>;
/**
 * Checks whether an object is marked as intent.
 * @param target Object to test.
 * @returns `true` when marked as intent.
 */
declare function isIntent<T extends object>(target?: T): target is Intent<T>;
/**
 * Marks an object as inert so it is skipped by proxy mediation.
 * @param target Object to mark.
 * @returns The same object with inert typing.
 */
declare function inert<T extends object>(target: T): Inert<T>;
/**
 * Removes the inert marker from an object.
 * @param target Object to unmark.
 * @returns The same object with live typing.
 */
declare function live<T extends object>(target: T): Live<T>;
/**
 * Checks whether an object is marked as inert.
 * @param target Object to test.
 * @returns `true` when inert.
 */
declare function isInert<T extends object>(target?: T): target is Inert<T>;
/**
 * Marks an object as volatile (indiffable enabled).
 * @param target Object to mark.
 * @returns The same object with volatile typing.
 */
declare function volatile<T extends object>(target: T): Volatile<T>;
/**
 * Removes volatile behavior from an object.
 * @param target Object to unmark.
 * @returns The same object with stable typing.
 */
declare function stable<T extends object>(target: T): Stable<T>;
/**
 * Checks whether an object is marked as volatile.
 * @param target Object to test.
 * @returns `true` when marked as volatile.
 */
declare function isVolatile<T extends object>(target?: T): target is Volatile<T>;
/**
 * Gets the raw (unproxied) version of an object if it's proxied, otherwise returns the original object.
 * @param target Object to unwrap.
 * @returns Raw object if proxied, else the original object. Use `Reactor.snapshot(true)` for deep unwrapping.
 */
declare function getRaw<T extends object>(target?: T): T;
/**
 * Gets the current structural version of an object.
 * @param target Object to inspect.
 * @returns Version number.
 */
declare function getVersion<T extends object>(target?: T): number;
/**
 * Gets the current snapshot-cache version of an object.
 * @param target Object to inspect.
 * @returns Snapshot version number.
 */
declare function getSnapshotVersion<T extends object>(target?: T): number;

// ===========================================================================
// CORE MARKERS & STATE WRAPPERS
// ===========================================================================

/** Marks an object as inert (excluded from proxy handling). */
type Inert<T> = T & { [INERTIA]?: true };
/** Removes inert marker typing. */
type Live<T> = T extends Inert<infer U> ? U : T;

/** Marks an object as intent (rejectable). */
type Intent<T> = T & { [REJECTABLE]?: true };
/** Removes intent marker typing. */
type State<T> = T extends Intent<infer U> ? U : T;

/** Marks an object as volatile/indiffable. */
type Volatile<T> = T & { [INDIFFABLE]?: true };
/** Removes volatile marker typing. */
type Stable<T> = T extends Volatile<infer U> ? U : T;


// ===========================================================================
// EVENT SYSTEM & PAYLOADS
// ===========================================================================

/** Path-scoped value container used by payloads/events. */
interface Target<T, P extends WildPaths<T> = WildPaths<T>> {
  /** Dotted path for this value. */
  path: P;
  /** Current value at the path. */
  value: PathValue<T, P>;
  /** Previous value at the path (only for `set` and `delete` events). */
  oldValue?: PathValue<T, P>;
  /** Key for the value on it's parent object. */
  key: PathKey<T, P>;
  /**
   * Whether the key for the value existed on the parent object.
   * For accuracy on if `key` was in the `object` rather than checking `oldValue` against undefined
   */
  hadKey: boolean;
  /** Parent-branch value for the path. */
  object: PathBranchValue<T, P>;
}

/** Runtime payload union for mediated operations and update waves (Creates the IDE magic). */
type Payload<T, P extends WildPaths<T> = WildPaths<T>, D extends number = MaxDepth> =
  | DirectPayload<T, P>
  | UpdatePayload<T, P, D>;

interface BasePayload<T, P extends WildPaths<T> = WildPaths<T>> {
  /**
   * Current target context for the active propagation path.
   * Same reference to `target`, here for seamless API switches: `watch()` -> `on()`.
   */
  currentTarget: Target<T, P>;
  /** Root reactive object for this payload. */
  root: T;
  /** For mediators to signal operation termination but doesn't stop the chain */
  terminated?: boolean;
  /** Whether resolve/reject intent semantics are allowed on the event this routes to. */
  rejectable: boolean;
}
interface DirectPayload<T, P extends WildPaths<T> = WildPaths<T>> extends BasePayload<T, P> {
  /** Type of the operation that triggered this payload. */
  type: "init" | "get" | "set" | "delete"; // init during `immediate: true` sync
  /** Target context for this payload. */
  target: Target<T, P>;
}
interface UpdatePayload<
  T,
  P extends WildPaths<T> = WildPaths<T>,
  D extends number = MaxDepth
> extends BasePayload<T, P> {
  /** Type of the operation that triggered this payload, i.e. "update" */
  type: "update";
  /** Target context for this payload. */
  target: Target<T, ChildPaths<T, P, ".", D>>; // Target is strictly one of the child paths!
}

/** Event union with payload-aware overrides for `type`, `path`, and value fields (Creates the IDE magic). */
type REvent<
  T extends object,
  P extends WildPaths<T> = WildPaths<T>,
  D extends number = MaxDepth
> =
  | (Omit<ReactorEvent<T, P>, OverrideEvtProp> &
      DirectPayload<T, P> &
      OverrideEvt<DirectPayload<T, P>>)
  | (Omit<ReactorEvent<T, P>, OverrideEvtProp> &
      UpdatePayload<T, P, D> &
      OverrideEvt<UpdatePayload<T, P, D>>);

type OverrideEvtProp = "type" | "target" | "value" | "oldValue" | "path";
interface OverrideEvt<PL extends { target: { path: any; value: any; oldValue?: any } }> {
  path: PL["target"]["path"];
  value: PL["target"]["value"];
  oldValue: PL["target"]["oldValue"];
}

// ===========================================================================
// REACTIVITY CALLBACKS (The Handlers)
// ===========================================================================

/** Get mediator callback. */
type Getter<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  payload: Payload<T, P>
) => PathValue<T, P> | undefined;

/** Set mediator callback. */
type Setter<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  terminated: boolean,
  payload: Payload<T, P>
) => PathValue<T, P> | typeof TERMINATOR | undefined;

/** Delete mediator callback. */
type Deleter<T, P extends WildPaths<T> = WildPaths<T>> = (
  terminated: boolean,
  payload: Payload<T, P>
) => typeof TERMINATOR | undefined;

/** Watch callback (synchronous path observer). */
type Watcher<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  payload: Payload<T, P>
) => void;

/** Listener callback (batched/asynchronous by default). */
type Listener<
  T extends object,
  P extends WildPaths<T> = WildPaths<T>,
  D extends number = MaxDepth
> = (event: REvent<T, P, D>) => void;

// ===========================================================================
// ENGINE RECORDS (Internal Storage)
// ===========================================================================

type GetterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Getter<T, P>;
  clup: () => boolean | undefined; // Registration Cleanup
  sclup?: () => void; // AbortSignal Cleanup
} & SyncOptionsTuple;

/** Internal registry record for `set` mediators. */
type SetterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Setter<T, P>;
  clup: () => boolean | undefined;
  sclup?: () => void;
} & SyncOptionsTuple;

type DeleterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Deleter<T, P>;
  clup: () => boolean | undefined;
  sclup?: () => void;
} & SyncOptionsTuple;

type WatcherRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Watcher<T, P>;
  clup: () => boolean | undefined;
  sclup?: () => void;
} & SyncOptionsTuple;

type ListenerRecord<
  T extends object,
  P extends WildPaths<T> = WildPaths<T>,
  D extends number = MaxDepth
> = {
  cb: Listener<T, P, D>;
  clup: () => boolean | undefined;
  sclup?: () => void;
  lDepth?: number; // Listener Depth
} & ListenerOptionsTuple<D>;

// ===========================================================================
// CONFIGURATION OPTIONS
// ===========================================================================

interface SyncOptionsTuple {
  /** Whether to defer activation until the next tick. */
  lazy?: boolean;
  /** Whether the callback should only run once. */
  once?: boolean;
  /** Optional `AbortSignal` to automatically handle registration cleanup. */
  signal?: AbortSignal;
  /** Whether to run the callback immediately during registration, "auto" runs only if path exists. */
  immediate?: boolean | "auto";
}
/** Tuple-form and shorthand boolean for mediator/watch registrations. */
type SyncOptions = boolean | SyncOptionsTuple;

interface ListenerOptionsTuple<D extends number = MaxDepth>
  extends Omit<SyncOptionsTuple, "lazy"> {
  /** Whether to listen on the capture phase against bubble. */
  capture?: boolean;
  /** Maximum path nested depth for event propagation, try `1` if listening to an array with nested objects. */
  depth?: D;
}
/** Tuple-form and shorthand boolean for listener registrations. */
type ListenerOptions<D extends number = MaxDepth> = boolean | ListenerOptionsTuple<D>;

/** Options accepted by adapter effects (`sync: true` -> watch mode else listener mode). */
type EffectOptions =
  | (Omit<SyncOptionsTuple, "immediate"> & { sync: true })
  | (Omit<ListenerOptionsTuple, "immediate"> & { sync?: false });

/** Reactor bootstrap/build configuration. */
interface ReactorBuild<T extends object, P extends Paths<T> = Paths<T>> {
  /** 1-time set: Enables debug logging and diagnostics. */
  debug?: boolean;
  /** Enables cross-realm object detection support (e.g. iframes). */
  crossRealms?: boolean;
  /** Enables structural-sharing snapshot behavior (requires `referenceTracking: true`). */
  smartCloning?: boolean;
  /** Enables event bubbling across ancestor paths, remove to use only capturing with one-way loops (default: true). */
  eventBubbling?: boolean;
  /** Enables path lineage tracing for reference lookups on property access (requires `referenceTracking: true`). */
  lineageTracing?: boolean;
  /** Preserves Reflect trap context; safer with ~8x slowdown in hot paths, allows more types to be proxied (e.g. Classes). */
  preserveContext?: boolean;
  /** Enables high-resolution timestamps on events, prefer over custom solutions for accuracy (default: false). */
  eventTimeStamps?: boolean;
  /** Custom equality used by setters and adapter comparisons (default: `Object.is`). */
  equalityFunction?: (a: any, b: any) => boolean;
  /** Custom batching scheduler for listener notification flushes (default: `queueMicrotask`). */
  batchingFunction?: (cb: () => void) => void;
  /** Enables identity/reference tracking features in the runtime. */
  referenceTracking?: boolean;
  /** Root-level `get` initial mediator; can transform or override all read values. */
  get?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    value: PathValue<T, P>,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => PathValue<T, P> | undefined; // "almighty" mediation
  /** Root-level `set` initial mediator; can transform all writes or return `TERMINATOR`. */
  set?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    value: PathValue<T, P>,
    oldValue: PathValue<T, P>,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => PathValue<T, P> | typeof TERMINATOR | undefined; // "almighty" mediation
  /** Root-level `deleteProperty` initial mediator; can block via `TERMINATOR`. */
  deleteProperty?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    oldValue: PathValue<T, P>,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => typeof TERMINATOR | undefined; // "almighty" mediation
  /** Root-level `has` initial mediator; can observe or modify results. */
  has?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    has: boolean,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => boolean; // "almighty" mediation
  /** Root-level `getOwnPropertyDescriptor` initial mediator; can observe or modify results. */
  getOwnPropertyDescriptor?: (
    object: PathBranchValue<T, P>,
    key: PathKey<T, P>,
    descriptor: PropertyDescriptor | undefined,
    receiver: Reactive<T>,
    path: Paths<T> | Paths<T>[]
  ) => PropertyDescriptor | undefined; // "almighty" mediation
  /** Root-level `ownKeys` initial mediator; can observe or modify results. */
  ownKeys?: (
    object: PathBranchValue<T, P>,
    keys: (string | symbol)[],
    receiver: Reactive<T>,
    path: WildPaths<T>
  ) => (string | symbol)[]; // "almighty" mediation
} // debating keeping use of the Reflect API opt-in

declare const arrRegex: RegExp;
/** Checks if a value type is an object for common use cases. */
declare function isObj<T extends object = object>(obj: any, arraycheck?: boolean): obj is T;
/** Checks if a value is a "Plain Old Javascript Object". */
declare function isPOJO<T extends object = object>(obj: any, config?: {
    crossRealms?: boolean;
}, typecheck?: boolean): obj is T;
/** Returns whether a value can be proxied by the reactor runtime. */
declare function canHandle(obj: any, config?: {
    crossRealms?: boolean;
    preserveContext?: boolean;
}, typecheck?: boolean): boolean;
/**
 * Gets a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * const name = getAny(state, "user.profile.name");
 */
declare function getAny<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(source: T, key: P, separator?: S, keyFunc?: (p: string) => string): PathValue<T, P, S>;
/**
 * Sets a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * setAny(state, "user.profile.name", "Grace");
 * @example
 * const state = { users: [] as Array<{ name?: string }> };
 * setAny(state, "users[0].name" as any, "Kosi");
 */
declare function setAny<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(target: T, key: P, value: PathValue<T, P, S>, separator?: S, keyFunc?: (p: string) => string): void;
/**
 * Deletes a value by path.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * deleteAny(state, "user.profile.name");
 */
declare function deleteAny<T extends object, const S extends string = ".", P extends WildPaths<T, S> = WildPaths<T, S>>(target: T, key: P, separator?: S, keyFunc?: (p: string) => string): void;
/**
 * Checks whether a path exists.
 * @example
 * const state = { user: { profile: { name: "Kosi" } } };
 * const ok = inAny(state, "user.profile.name"); // default loose typing due to it's usecase
 */
declare function inAny<T extends object, const S extends string = ".", P extends string = string>(source: T, key: P, separator?: S, keyFunc?: (p: string) => string): boolean;
/**
 * Converts flattened keys into nested object structure.
 * @example
 * const flat = { "user.name": "Kosi", "user.role": "admin" };
 * const obj = parseAnyObj(flat);
 */
declare function parseAnyObj<T extends Record<string, any>, const S extends string = ".">(obj: T, separator?: S, keyFunc?: (p: string) => string, seen?: WeakSet<WeakKey>): Unflatten<T, S>;
/** Normalizes boolean/object event options into a single options object. */
declare function parseEvtOpts<T extends object, const K extends (keyof T)[] | readonly (keyof T)[], const O extends K[number] = K[0]>(options: T | boolean | undefined, opts: K, boolOpt?: O, result?: T): T & {
    [P in O]-?: T[P];
};
interface FanoutTuple extends Partial<Record<(typeof fanoutOptsArr)[number], any>> {
    /** Whether to merge values before fanout, useful for patching usecases. */
    merge?: boolean;
    /** How many levels to fan out, set based on your listener paths max dots. `true` is `Infinity`, defaults to `1` for event cascading otherwise `Infinity`. */
    depth?: number | boolean;
    /** Whether to assign arrays as a whole and only touch `.length` for common cases. Only works with the `path` parameter overload or in nested levels.
     * Arrays can lead to unnecessary work as more often than not, you won't be watching index paths but waiting on the parent bubble instead.
     * If you happen to be watching, it might be more optimal to re-set it yourself if it's only a few indexes or just turn set this to `false`. */
    atomic?: boolean;
}
/**
 * Unified expansion utility.
 * Bridges Coarse (Immutable replacement) writes into Fine-grained (Reactive) writes by surgically
 * expanding a single object write into multiple granular child operations for deep optimal xbubbling.
 * @example
 * // Event Mode (Cascading after-write)
 * rtr.on("user", (e) => fanout(e, { depth: 1 })); // defaults to 1 level deep for events
 * @example
 * // Direct Mode (Patching before-write)
 * fanout(state.user, { session: { id: 1, name: "Kosi", role: "admin" } }, { depth: Infinity }); // default to `Infinity` here
 */
declare function fanout<T extends object>(event: ReactorEvent<T> | Payload<T>, options?: {
    crossRealms?: boolean;
} & FanoutTuple): void;
declare function fanout<T extends object>(target: T, value: Partial<T>, options?: {
    crossRealms?: boolean;
} & FanoutTuple): void;
declare function fanout<T extends object, P extends WildPaths<T> = WildPaths<T>>(state: T, path: P, value: Partial<PathValue<T, P>>, options?: {
    crossRealms?: boolean;
} & FanoutTuple): void;
declare const fanoutOptsArr: readonly ["merge", "depth", "atomic"];
/**
 * Deep-merges object-like values, does necessary checks so use without doubts.
 * @example
 * const next = mergeObjs({ user: { name: "Kosi" } }, { user: { role: "admin" } }); // { ...o1, ...o2 } // o2 over o1 and deep!
 */
declare function mergeObjs<T1 extends object, T2 extends object>(o1?: T1 | null, o2?: T2 | null, config?: {
    crossRealms?: boolean;
}, pojocheck?: boolean): DeepMerge<T1, T2>;
/** Returns [path, parent, value] records from root to the target path. */
declare function getTrailRecords<T extends object>(obj: T, path: WildPaths<T>, reverse?: boolean): [WildPaths<T>, PathBranchValue<T, WildPaths<T>>, PathValue<T, WildPaths<T>>][];
/**
 * Deep-clones supported object structures.
 * @example
 * const cloned = deepClone({ user: { name: "Kosi" } });
 */
declare function deepClone<T>(obj: T, config?: {
    crossRealms?: boolean;
    preserveContext?: boolean;
}, seen?: WeakMap<WeakKey, any>): T;
/** Nulls all non-function instance properties across the prototype chain. */
declare function nuke(target: any): void;

type ReactorModuleId = string | number;
type ModulePaths<P extends string = string> = P[] | Partial<Record<string, P[]>>;
interface ReactorModuleConstructor<P extends BaseReactorModule = BaseReactorModule, T extends object = any> {
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
declare abstract class BaseReactorModule<T extends object = any, Config = any, State = any> {
    static readonly moduleName: string;
    get name(): string;
    protected ac: AbortController;
    protected readonly signal: AbortSignal;
    protected rtrs: Map<ReactorModuleId, Reactor<any>>;
    protected rids: WeakMap<Reactor<any>, ReactorModuleId>;
    protected wired: boolean;
    /** The reactive configuration object for the module, manipulate to change behaviour. */
    config: Config extends object ? Reactive<Config> : Config;
    /** The reactive state object for the module, watch to see exposed lifecycle changes. */
    readonly state: State extends object ? Reactive<State> : State;
    constructor(config?: Config, rtr?: Reactor<T>, state?: State);
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
    attach(target?: Reactor<any> | Reactive<any>, id?: ReactorModuleId): this;
    protected onAttach(_rtr: Reactor<any>, _rid?: ReactorModuleId): void;
    /**
     * Entry point called to initialize module wiring, calls `.attach(target, id)` first, `Reactor.use()` calls this internally.
     * Should run as last in `.attach()` chain or after all desired reactors if using multiple; so wiring is done safely after.
     * @param target `Reactor` instance or `reactive()` object to connect to.
     * @param id Optional id for the reactor, prefer over default implicit index id when managing multiple reactors.
     * @returns Current `ReactorModule` instance for fluent chaining.
     * @example
     * const mod = new MyModule().attach(state1).setup(state2); // if using multiple, this should run last; with same params as `.attach()` for a shorter chain
     */
    setup(target?: Reactor<any> | Reactive<any>, id?: ReactorModuleId): this;
    /** set up listeners/subscriptions and module runtime wiring. */
    abstract wire(): void;
    destroy(): void;
    protected onDestroy?(): void;
    /**
     * Wraps a function with module-scoped error logging.
     * Use this when creating functions dynamically (for example, before attaching an anonymous listener on the fly).
     * @example
     * window.addEventListener("resize", this.guard(() => this.syncLayout(true)), { signal: this.signal });
     */
    guard: <Fn extends Function>(fn: Fn) => Fn;
    /**
     * Path resolution utility for modules, provides automatic reactor id resolution for multi-reactor setups.
     * @param paths Paths to filter by, supports same formats as `ModulePaths`, will be resolved with the module's reactor id if applicable.
     * @param target Reactor or reactor id to resolve paths for when using per-reactor path lists`.
     * @returns Resolved paths array, defaults to `["*"]` if no paths are found using search criteria.
     */
    protected getPaths<P extends string = string>(paths?: ModulePaths<P>, target?: Reactor<any> | ReactorModuleId): P[];
}

/**
 * - Core S.I.A runtime for path mediation, observation, and event propagation.
 * - Provides path-level mediators (`get|set|delete`), synchronous watchers (`watch`), and batched listeners (`on`).
 * Supports wildcard/path-based subscriptions, optional reference tracking, and module-based extensions.
 * @typeParam T Root state object type.
 */
declare class Reactor<T extends object> {
    /** Logger function for this reactor instance, override if desired, `this.canLog = false` resets. */
    log: (...args: any[]) => void;
    /** The core state object for this reactor instance. */
    core: T;
    /** The modules being used by this reactor. */
    modules?: Set<BaseReactorModule<T>>;
    /** Configuration options for this reactor instance. */
    config: Omit<ReactorBuild<T>, "debug">;
    /** Whether this reactor instance is currently batching updates, a window view into the engine timing */
    isBatching: boolean;
    protected queue?: Set<() => void>;
    protected batch?: Map<Paths<T>, Payload<T>>;
    protected lineage?: WeakMap<object, (object | string)[]>;
    protected snapCache?: WeakMap<object, any>;
    protected proxyCache: WeakMap<object, any>;
    protected getters?: Map<WildPaths<T>, Array<GetterRecord<T>>>;
    protected setters?: Map<WildPaths<T>, Array<SetterRecord<T>>>;
    protected deleters?: Map<WildPaths<T>, Array<DeleterRecord<T>>>;
    protected watchers?: Map<WildPaths<T>, Array<WatcherRecord<T>>>;
    protected listeners?: Map<WildPaths<T>, Array<ListenerRecord<T>>>;
    /**
     * Creates a new Reactor instance.
     * @param target Initial state target.
     * @param build Reactor bootstrap/build configuration.
     * @example
     * const rtr = new Reactor({ count: 0 });
     */
    constructor(target?: T, build?: ReactorBuild<T>);
    proxied<O extends object>(target: O, rejectable?: boolean, indiffable?: boolean, parent?: object, key?: string, path?: string): O;
    trace(target: object, path: string, paths?: string[], seen?: WeakSet<object>): Paths<T>[];
    protected link(target: any, parent: object, key: string, typecheck?: boolean, es?: (object | string)[]): boolean;
    protected unlink(target: any, parent: object, key: string): void;
    protected stamp(target: any, typecheck?: boolean, seen?: WeakSet<object>): void;
    mediate<P extends WildPaths<T>>(path: WildPaths<T>, payload: Payload<T, P>, type: "get", cords: GetterRecord<T>[]): PathValue<T, P>;
    mediate<P extends WildPaths<T>>(path: WildPaths<T>, payload: Payload<T, P>, type: "set", cords: SetterRecord<T>[]): PathValue<T, P>;
    mediate<P extends WildPaths<T>>(path: WildPaths<T>, payload: Payload<T, P>, type: "delete", cords: DeleterRecord<T>[]): PathValue<T, P>;
    notify<P extends Paths<T>>(path: P, payload: Payload<T, P>): void;
    protected schedule<P extends Paths<T>>(path: P, payload: Payload<T, P>): void;
    protected initBatching(): void;
    protected flush(): void;
    wave<P extends Paths<T>>(path: P, payload: Payload<T, P>): void;
    protected fire([path, object, value]: ReturnType<typeof getTrailRecords<T>>[number], e: REvent<T>, isCapture: boolean, cords?: ListenerRecord<T>[] | undefined): void;
    /**
     * Flushes queued listener payloads.
     * @param paths Optional path (or paths) to flush.
     * @example
     * rtr.tick(); // to flush all paths in batch or pass "*" wildcard
     * @example
     * rtr.tick("user.profile.name");
     */
    tick(paths?: Paths<T> | Iterable<Paths<T>>): void;
    /**
     * Queues a task to run after the current flush cycle.
     * @param task Task callback.
     * @example
     * const task = () => console.log("after flush");
     * rtr.stall(task);
     */
    stall(task: () => any): void;
    /**
     * Removes a queued post-flush task.
     * @param task Task callback.
     * @returns `undefined` when no queue, `false` when queue exist but callback is not found, `true` when removed.
     */
    nostall(task: () => any): boolean | undefined;
    getDepth(path: string, depth?: number): number;
    getContext<P extends WildPaths<T>>(path: P): Target<T, P>;
    protected bindSignal<Cb>(cord: GetterRecord<T> | SetterRecord<T> | DeleterRecord<T> | WatcherRecord<T> | ListenerRecord<T>, sig?: AbortSignal): Cb;
    protected cloned<O>(target: O, raw: boolean, seen?: WeakMap<WeakKey, any>): O;
    protected syncAdd<P extends WildPaths<T>>(key: "get" | "set" | "delete" | "watch", path: P, cb: any, opts: SyncOptions | undefined, onImmediate?: (immediate: boolean | "auto") => void): () => boolean | undefined;
    protected syncDrop<P extends WildPaths<T>>(store: Map<WildPaths<T>, any[]> | undefined, path: P, cb: any): boolean | undefined;
    /**
     * Registers a get mediator for a path.
     * @param path Path or wildcard path.
     * @param callback Mediator callback.
     * @param options Sync options.
     * @returns Cleanup function.
     * @example
     * const cleanup = rtr.get("user.name", (value) => String(value).trim());
     */
    get<P extends WildPaths<T>>(path: P, callback: Getter<T, P>, options?: SyncOptions): GetterRecord<T>["clup"];
    /** Registers a get mediator for a path that only triggers once. */
    gonce<P extends WildPaths<T>>(path: P, callback: Getter<T, P>, options?: SyncOptions): GetterRecord<T>["clup"];
    /**
     * Removes a get mediator for a path.
     * @param path Path or wildcard path.
     * @param callback Mediator callback to remove.
     * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
     */
    noget<P extends WildPaths<T>>(path: P, callback: Getter<T, P>): boolean | undefined;
    /**
     * Registers a set mediator for a path.
     * @param path Path or wildcard path.
     * @param callback Mediator callback.
     * @param options Sync options.
     * @returns Cleanup function.
     * @example
     * rtr.set("user.name", (value) => String(value).trim());
     */
    set<P extends WildPaths<T>>(path: P, callback: Setter<T, P>, options?: SyncOptions): SetterRecord<T>["clup"];
    /** Registers a set mediator for a path that only triggers once. */
    sonce<P extends WildPaths<T>>(path: P, callback: Setter<T, P>, options?: SyncOptions): SetterRecord<T>["clup"];
    /**
     * Removes a set mediator for a path.
     * @param path Path or wildcard path.
     * @param callback Mediator callback to remove.
     * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
     */
    noset<P extends WildPaths<T>>(path: P, callback: Setter<T, P>): boolean | undefined;
    /**
     * Registers a delete mediator for a path.
     * @param path Path or wildcard path.
     * @param callback Mediator callback.
     * @param options Sync options.
     * @returns Cleanup function.
     * @example
     * rtr.delete("cache.temp", () => TERMINATOR);
     */
    delete<P extends WildPaths<T>>(path: P, callback: Deleter<T, P>, options?: SyncOptions): DeleterRecord<T>["clup"];
    /** Registers a delete mediator for a path that only triggers once. */
    donce<P extends WildPaths<T>>(path: P, callback: Deleter<T, P>, options?: SyncOptions): DeleterRecord<T>["clup"];
    /**
     * Removes a delete mediator for a path.
     * @param path Path or wildcard path.
     * @param callback Mediator callback to remove.
     * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
     */
    nodelete<P extends WildPaths<T>>(path: P, callback: Deleter<T, P>): boolean | undefined;
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
    watch<P extends WildPaths<T>>(path: P, callback: Watcher<T, P>, options?: SyncOptions): WatcherRecord<T>["clup"];
    /** Registers a watcher for a path that only triggers once. */
    wonce<P extends WildPaths<T>>(path: P, callback: Watcher<T, P>, options?: SyncOptions): WatcherRecord<T>["clup"];
    /**
     * Removes a watcher for a path.
     * @param path Path or wildcard path.
     * @param callback Watch callback to remove.
     * @returns `undefined` when the path has no records, `false` when records exist but callback is not found, `true` when removed.
     */
    nowatch<P extends WildPaths<T>>(path: P, callback: Watcher<T, P>): boolean | undefined;
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
    on<P extends WildPaths<T>, const D extends number = MaxDepth>(path: P, callback: Listener<T, P, D>, options?: ListenerOptions<D>): ListenerRecord<T, P, D>["clup"];
    /** Registers an event listener for a path that only triggers once. */
    once<P extends WildPaths<T>, const D extends number = MaxDepth>(path: P, callback: Listener<T, P, D>, options?: ListenerOptions<D>): ListenerRecord<T, P, D>["clup"];
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
    off<P extends WildPaths<T>, const D extends number = MaxDepth>(path: P, callback: Listener<T, P, D>, options?: ListenerOptions<D>): boolean | undefined;
    /**
     * Creates a snapshot; possibly clone of state (or a state branch).
     * You could alternatively use or serialize your proxied state "as is" except the environment demands no proxies or new references.
     * @param raw Use raw (deep unproxied & uncloned) version of branch, defaults to `true` if `config.smartCloning: false`.
     * @param branch Specific branch to clone.
     * @returns Snapshot deep or smart (structurally shared) clone.
     * @example
     * const snap = rtr.snapshot();
     * @example
     * const snap = rtr.snapshot(false, rtr.core.history.past);
     */
    snapshot(raw?: boolean): T;
    snapshot<B>(raw?: boolean, branch?: B): B;
    /**
     * Installs a module instance.
     * @param target Module instance.
     * @param id Optional identification tag for this instance in the module.
     * @returns Current `Reactor` instance for fluent chaining.
     */
    use(target: BaseReactorModule<T>, id?: ReactorModuleId): this;
    /** Resets this reactor instance to its initial state. */
    reset(): void;
    destroy(): void;
    get canLog(): boolean;
    set canLog(value: boolean);
    get canLineageTrace(): boolean | undefined;
    get canSmartClone(): boolean | undefined;
}

/**
 * - Auto-dependency tracker used to subscribe only to accessed paths.
 * - `tracked(...)` wraps a snapshot in a read-tracking proxy, and `callback(...)`
 * binds subscriptions for collected paths using `watch` (sync) or `on` (batched).
 * @typeParam T Root state object type.
 */
declare class Autotracker<T extends object> {
    proxy: T;
    deps: Map<Reactor<any>, Set<string>>;
    isTracking: boolean;
    protected rtr?: Reactor<T>;
    /** only allows one reactor to autotrack when available */
    protected autortr?: Reactor<T>;
    protected clups: Array<() => void>;
    protected lastPath?: WildPaths<T>;
    protected proxyCache: WeakMap<object, any>;
    /** @param rtr Reactor instance used for path subscriptions. */
    constructor(rtr?: Reactor<T>);
    /**
     * Starts a new tracking pass and returns a readonly tracking proxy for `target` if `this` was instantiated with a `Reactor`.
     * @param target Snapshot (or state branch) to track reads from.
     * @returns Read-tracking readonly proxy.
     * @example
     * const atrkr = new Autotracker(rtr);
     * const state = atrkr.tracked(rtr.snapshot());
     * const name = state.user.profile.name;
     */
    tracked(target: T): DeepReadonly<T>;
    protected proxied<O extends object>(obj: O, path: string): O;
    /** Adds a path to the tracking set. */
    track<const P extends WildPaths<T>>(path: P, rtr?: Reactor<any>, prune?: boolean): P;
    /** Removes a path from the tracking set. */
    untrack(path: WildPaths<T>, rtr?: Reactor<any>): void;
    /** Enables path tracking. */
    unblock(rtr?: Reactor<any>): void;
    /** Temporarily disables path tracking. */
    block(): void;
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
    callback(cb: () => void, options?: EffectOptions): () => void;
    /** Clears active subscriptions and blocks tracking. */
    cleanup(): void;
    destroy(): void;
}
/**
 * Utility function to run a callback with a specific tracker context, restoring the previous context afterward.
 * @param tracker The Autotracker instance to set as the active tracker during the callback execution.
 * @param run The callback function to execute with the specified tracker context.
 * @param rtr Optional Reactor instance to associate with the tracker during execution.
 * @returns The result of the callback function.
 */
declare function withTracker<T>(tracker: Autotracker<any>, run: () => T, rtr?: Reactor<any>): T;

/** Global context object for sharing state across the reactor runtime. */
declare const CTX: {
    /** Flag indicating whether the application is running in development mode. */
    isDevEnv: boolean;
    /** Flag indicating whether a cascade is currently ongoing so reactors can allow all writes. */
    isCascading: boolean;
    /** Active `Autotracker` instance, override for automatic dependency collection on `Reactor` traps. */
    autotracker: Autotracker<any> | null;
};
/** Marker to access underlying raw object from a proxy. */
declare const RAW: unique symbol;
/** Marker to opt an object out of reactor proxy handling. */
declare const INERTIA: unique symbol;
/** Marker to mark a branch as intent (rejectable). */
declare const REJECTABLE: unique symbol;
/** Marker to enable indifference/non-equality semantics for a branch. */
declare const INDIFFABLE: unique symbol;
/** Sentinel return value that terminates a mediated operation. */
declare const TERMINATOR: unique symbol;
/** Internal mutation version marker. */
declare const VERSION: unique symbol;
/** Internal snapshot version marker used by smart cloning. */
declare const SSVERSION: unique symbol;
/** Default batching scheduler used by the reactor runtime. */
declare const RTR_BATCH: (callback: Function, ...args: any[]) => void;
/** Default reactor logger prefix function. */
declare const RTR_LOG: (...args: any[]) => void;
/** Canonical option keys parsed for listener and mediator registrations. */
declare const EVT_OPTS: {
    readonly LISTENER: readonly ["capture", "depth", "once", "signal", "immediate"];
    readonly MEDIATOR: readonly ["lazy", "signal", "immediate"];
};
/** Frozen empty object used as a zero-allocation default options value. */
declare const NIL: any;
/** Shared no-operation function. */
declare const NOOP: () => void;

declare function clamp(min: number | undefined, val: number, max?: number): number;

/**
 * setTimeout wrapper with optional AbortSignal and Window overrides.
 * @param handler Timeout callback or handler string.
 * @param timeout Delay in milliseconds.
 * @param args Optional args, where first may be AbortSignal and second may be Window to be consumed for enhancements.
 * @returns Timer id, or -1 when signal is already aborted.
 */
declare function setTimeout(handler: TimerHandler, timeout?: number, ...args: any[]): number;
/**
 * setInterval wrapper with optional AbortSignal and Window overrides.
 * @param handler Interval callback or handler string.
 * @param timeout Interval delay in milliseconds.
 * @param args Optional args, where first may be AbortSignal and second may be Window to be consumed for enhancements.
 * @returns Interval id, or -1 when signal is already aborted.
 */
declare function setInterval(handler: TimerHandler, timeout?: number, ...args: any[]): number;
/**
 * requestAnimationFrame wrapper with optional AbortSignal and Window overrides.
 * @param callback Frame callback.
 * @param sig Optional AbortSignal to cancel scheduled frame.
 * @param win Optional Window override.
 * @returns Frame request id, or -1 when signal is already aborted.
 */
declare function requestAnimationFrame(callback: FrameRequestCallback, sig?: AbortSignal, win?: Window & typeof globalThis): number;

/**
 * Walks an instance and its prototype chain, invoking a callback for each callable method.
 * @param owner Instance whose methods are inspected.
 * @param callback Invoked for each method name found.
 * @param skipOwn Skips owner-level methods when traversing own or parent prototypes.
 * @param nested Internal traversal flag, Override to `true` to avoid skipping own methods when `skipOwn` is `true`.
 */
declare function onAllMethods(owner: any, callback: (method: string, owner: any) => void, skipOwn?: boolean, nested?: boolean): void;
/**
 * Binds all discovered methods on an owner to the owner instance.
 * @param owner Instance whose methods should be bound.
 */
declare function bindAllMethods(owner: any): void;
/**
 * Wraps all discovered methods in a guard function, optionally binding before wrapping.
 * @param owner Instance whose methods should be wrapped.
 * @param guardFn Wrapper factory used for each method.
 * @param bound Binds methods to owner before wrapping when true.
 */
declare function guardAllMethods(owner: any, guardFn?: (fn: Function) => Function, bound?: boolean): void;
/**
 * Wraps a function with try/catch and async rejection handling.
 * @template T Function type to preserve.
 * @param fn Function to wrap.
 * @param onError Error handler for sync throws and async rejections.
 * @returns Guarded function with the same call signature.
 */
declare function guardMethod<T extends Function>(fn: T, onError?: (e: any) => void): T;

/** Keyboard matching configuration used by utility helpers. */
interface keysSettings {
    /** Disables key handling when true. */
    disabled?: boolean;
    /** Combos that should call preventDefault when matched. */
    overrides?: string[];
    /** Action map from action id to combo or combo list. */
    shortcuts?: Record<string, string | string[]>;
    /** Combos that should be rejected immediately. */
    blocks?: string[];
    /** Enables exact combo matching instead of subset matching. */
    strictMatches?: boolean;
    /** Combos that are allowed as pass-through key actions. */
    whitelist?: string[];
}
/** Canonical key-combo structure used by parser and serializer helpers. */
type KeyStruct = Record<"ctrlKey" | "shiftKey" | "altKey" | "metaKey", boolean> & {
    key: string;
};
/**
 * Parses a combo string into modifier flags + terminal key.
 * @param combo Key combo string (for example: `"ctrl+shift+z"`).
 * @returns Parsed key structure with boolean modifier flags.
 * @example
 * parseKeyCombo("ctrl+shift+z")
 * // => { ctrlKey: true, shiftKey: true, altKey: false, metaKey: false, key: "z" }
 */
declare function parseKeyCombo(combo: string): KeyStruct;
/**
 * Serializes a key structure or keyboard event into canonical combo form.
 * @param e KeyboardEvent-like object or parsed key structure.
 * @returns Canonical combo string (for example: `"ctrl+shift+z"`).
 */
declare function stringifyKeyEvent(e: KeyStruct | KeyboardEvent): string;
/**
 * Normalizes combo(s) by:
 * - lowercasing,
 * - aliasing `cmd -> meta`, `space -> " "`,
 * - preserving literal space/plus edge cases,
 * - sorting modifiers as `ctrl, alt, shift, meta`.
 * @param combo Raw combo or list of combos.
 * @returns Canonical combo string or list.
 * @example
 * cleanKeyCombo(["Shift+Ctrl+Z", "cmd+y"])
 * // => ["ctrl+shift+z", "meta+y"]
 */
declare function cleanKeyCombo(combo: string): string;
declare function cleanKeyCombo(combo: string[]): string[];
/**
 * Determines if actual combo satisfies required combo rule(s).
 * Non-strict mode performs subset matching (required keys must all be present).
 * Strict mode requires exact canonical equality.
 * @param required Required combo or combo list.
 * @param actual Actual combo string.
 * @param strict Whether to require exact match.
 * @returns `true` when match succeeds.
 */
declare function matchKeys(required: string | string[], actual: string, strict?: boolean): boolean;
/**
 * Resolves key-combo terms against settings:
 * - override, block, whitelist, and matched action id.
 * @param combo Canonical combo string.
 * @param settings Matching settings.
 * @returns Match resolution record.
 */
declare function getTermsForKey(combo: string, settings: keysSettings): {
    override: boolean;
    block: boolean;
    whitelisted: boolean;
    action: string | null;
};
/**
 * Evaluates whether a keyboard event is allowed and maps it to an action id.
 * Behavior order:
 * 1. hard gate checks (`disabled`, focused editable, button-space/enter),
 * 2. blocked combos,
 * 3. override combos (`preventDefault`),
 * 4. shortcut action match,
 * 5. whitelist pass-through.
 * @param e Browser keyboard event.
 * @param settings Matching settings.
 * @returns Action id, pass-through key, or `false` when denied.
 */
declare function keyEventAllowed(e: KeyboardEvent, settings: keysSettings): false | string;
/**
 * Formats one or many combos for human-readable UI labels.
 * @param combo Combo or combo list.
 * @returns Display label (for example: `" (ctrl+z) or (meta+z)"`).
 */
declare const formatKeyForDisplay: (combo: string | string[]) => string;
/**
 * Formats an action-shortcuts map for display labels.
 * @param keyShortcuts Action to combo(s) map.
 * @returns Action to display-label map.
 */
declare function formatKeyShortcutsForDisplay(keyShortcuts: Record<string, string | string[]>): Record<string, string>;
/**
 * Converts combo text into WAI-ARIA `aria-keyshortcuts` format.
 * - When `formatted=true`, `s` is treated as already display-formatted text.
 * - When `formatted=false`, `s` is treated as raw combo(s) and is first formatted.
 * @param s Combo text or combo list.
 * @param formatted Whether `s` is already display-formatted.
 * @returns Normalized aria-keyshortcuts string.
 * @example
 * parseForARIAKS(" (ctrl+z) or (meta+z)")
 * // => "Control+z Meta+z"
 * @example
 * parseForARIAKS(["ctrl+z", "meta+z"], false)
 * // => "Control+z Meta+z"
 */
declare function parseForARIAKS(s: string | string[], formatted?: boolean): string;

type Dataset = Record<string, string | number>;
type Style = Partial<CSSStyleDeclaration>;
declare function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, props?: Partial<HTMLElementTagNameMap[K]>, dataset?: Dataset, styles?: Style): HTMLElementTagNameMap[K];
declare function createEl(tag: string, props?: Partial<HTMLElement>, dataset?: Dataset, styles?: Style): HTMLElement | null;
declare function assignEl<K extends keyof HTMLElementTagNameMap>(el?: HTMLElementTagNameMap[K], props?: Partial<HTMLElementTagNameMap[K]>, dataset?: Dataset, styles?: Style): void;
declare function assignEl(el?: HTMLElement | null, props?: Partial<HTMLElement>, dataset?: Dataset, styles?: Style): void;

type utils_FanoutTuple = FanoutTuple;
type utils_KeyStruct = KeyStruct;
declare const utils_arrRegex: typeof arrRegex;
declare const utils_assignEl: typeof assignEl;
declare const utils_bindAllMethods: typeof bindAllMethods;
declare const utils_canHandle: typeof canHandle;
declare const utils_clamp: typeof clamp;
declare const utils_cleanKeyCombo: typeof cleanKeyCombo;
declare const utils_createEl: typeof createEl;
declare const utils_deepClone: typeof deepClone;
declare const utils_deleteAny: typeof deleteAny;
declare const utils_fanout: typeof fanout;
declare const utils_fanoutOptsArr: typeof fanoutOptsArr;
declare const utils_formatKeyForDisplay: typeof formatKeyForDisplay;
declare const utils_formatKeyShortcutsForDisplay: typeof formatKeyShortcutsForDisplay;
declare const utils_getAny: typeof getAny;
declare const utils_getTermsForKey: typeof getTermsForKey;
declare const utils_getTrailRecords: typeof getTrailRecords;
declare const utils_guardAllMethods: typeof guardAllMethods;
declare const utils_guardMethod: typeof guardMethod;
declare const utils_inAny: typeof inAny;
declare const utils_isObj: typeof isObj;
declare const utils_isPOJO: typeof isPOJO;
declare const utils_keyEventAllowed: typeof keyEventAllowed;
type utils_keysSettings = keysSettings;
declare const utils_matchKeys: typeof matchKeys;
declare const utils_mergeObjs: typeof mergeObjs;
declare const utils_nuke: typeof nuke;
declare const utils_onAllMethods: typeof onAllMethods;
declare const utils_parseAnyObj: typeof parseAnyObj;
declare const utils_parseEvtOpts: typeof parseEvtOpts;
declare const utils_parseForARIAKS: typeof parseForARIAKS;
declare const utils_parseKeyCombo: typeof parseKeyCombo;
declare const utils_requestAnimationFrame: typeof requestAnimationFrame;
declare const utils_setAny: typeof setAny;
declare const utils_setInterval: typeof setInterval;
declare const utils_setTimeout: typeof setTimeout;
declare const utils_stringifyKeyEvent: typeof stringifyKeyEvent;
declare namespace utils {
  export { type utils_FanoutTuple as FanoutTuple, type utils_KeyStruct as KeyStruct, utils_arrRegex as arrRegex, utils_assignEl as assignEl, utils_bindAllMethods as bindAllMethods, utils_canHandle as canHandle, utils_clamp as clamp, utils_cleanKeyCombo as cleanKeyCombo, utils_createEl as createEl, utils_deepClone as deepClone, utils_deleteAny as deleteAny, utils_fanout as fanout, utils_fanoutOptsArr as fanoutOptsArr, utils_formatKeyForDisplay as formatKeyForDisplay, utils_formatKeyShortcutsForDisplay as formatKeyShortcutsForDisplay, utils_getAny as getAny, utils_getTermsForKey as getTermsForKey, utils_getTrailRecords as getTrailRecords, utils_guardAllMethods as guardAllMethods, utils_guardMethod as guardMethod, utils_inAny as inAny, utils_isObj as isObj, utils_isPOJO as isPOJO, utils_keyEventAllowed as keyEventAllowed, type utils_keysSettings as keysSettings, utils_matchKeys as matchKeys, utils_mergeObjs as mergeObjs, utils_nuke as nuke, utils_onAllMethods as onAllMethods, utils_parseAnyObj as parseAnyObj, utils_parseEvtOpts as parseEvtOpts, utils_parseForARIAKS as parseForARIAKS, utils_parseKeyCombo as parseKeyCombo, utils_requestAnimationFrame as requestAnimationFrame, utils_setAny as setAny, utils_setInterval as setInterval, utils_setTimeout as setTimeout, utils_stringifyKeyEvent as stringifyKeyEvent };
}

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

type modules_AsyncStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> = AsyncStorageAdapter<Config>;
declare const modules_AsyncStorageAdapter: typeof AsyncStorageAdapter;
type modules_AsyncStorageAdapterConstructor<Config extends StorageAdapterConfig = StorageAdapterConfig> = AsyncStorageAdapterConstructor<Config>;
type modules_BaseReactorModule<T extends object = any, Config = any, State = any> = BaseReactorModule<T, Config, State>;
declare const modules_BaseReactorModule: typeof BaseReactorModule;
type modules_BaseStorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> = BaseStorageAdapter<Config>;
declare const modules_BaseStorageAdapter: typeof BaseStorageAdapter;
declare const modules_COOKIE_ADAPTER_BUILD: typeof COOKIE_ADAPTER_BUILD;
type modules_CookieAdapter = CookieAdapter;
declare const modules_CookieAdapter: typeof CookieAdapter;
type modules_CookieAdapterConfig = CookieAdapterConfig;
type modules_CookieOptions = CookieOptions;
type modules_HistoryEntry<T extends object = any, P extends Paths<T> = Paths<T>> = HistoryEntry<T, P>;
declare const modules_INDEXED_DB_ADAPTER_BUILD: typeof INDEXED_DB_ADAPTER_BUILD;
type modules_IndexedDBAdapter = IndexedDBAdapter;
declare const modules_IndexedDBAdapter: typeof IndexedDBAdapter;
type modules_IndexedDBAdapterConfig = IndexedDBAdapterConfig;
type modules_JSONReplacer = JSONReplacer;
type modules_JSONReviver = JSONReviver;
type modules_LocalStorageAdapter = LocalStorageAdapter;
declare const modules_LocalStorageAdapter: typeof LocalStorageAdapter;
type modules_MemoryAdapter = MemoryAdapter;
declare const modules_MemoryAdapter: typeof MemoryAdapter;
type modules_MemoryAdapterConfig = MemoryAdapterConfig;
type modules_ModulePaths<P extends string = string> = ModulePaths<P>;
declare const modules_PERSIST_MODULE_BUILD: typeof PERSIST_MODULE_BUILD;
type modules_PersistConfig<T extends object, P extends Paths<T> = Paths<T>> = PersistConfig<T, P>;
type modules_PersistModule<T extends object = any, P extends Paths<T> = Paths<T>> = PersistModule<T, P>;
declare const modules_PersistModule: typeof PersistModule;
type modules_ReactorModuleConstructor<P extends BaseReactorModule = BaseReactorModule, T extends object = any> = ReactorModuleConstructor<P, T>;
type modules_ReactorModuleId = ReactorModuleId;
type modules_SessionStorageAdapter = SessionStorageAdapter;
declare const modules_SessionStorageAdapter: typeof SessionStorageAdapter;
type modules_StorageAdapter<Config extends StorageAdapterConfig = StorageAdapterConfig> = StorageAdapter<Config>;
declare const modules_StorageAdapter: typeof StorageAdapter;
type modules_StorageAdapterConfig = StorageAdapterConfig;
type modules_StorageAdapterConstructor<Config extends StorageAdapterConfig = StorageAdapterConfig> = StorageAdapterConstructor<Config>;
declare const modules_TIME_TRAVEL_MODULE_BUILD: typeof TIME_TRAVEL_MODULE_BUILD;
type modules_TimeTravelConfig<T extends object, P extends Paths<T> = Paths<T>> = TimeTravelConfig<T, P>;
type modules_TimeTravelModule<T extends object = any, P extends Paths<T> = Paths<T>> = TimeTravelModule<T, P>;
declare const modules_TimeTravelModule: typeof TimeTravelModule;
type modules_TimeTravelState<T extends object, P extends Paths<T> = Paths<T>> = TimeTravelState<T, P>;
declare namespace modules {
  export { modules_AsyncStorageAdapter as AsyncStorageAdapter, type modules_AsyncStorageAdapterConstructor as AsyncStorageAdapterConstructor, modules_BaseReactorModule as BaseReactorModule, modules_BaseStorageAdapter as BaseStorageAdapter, modules_COOKIE_ADAPTER_BUILD as COOKIE_ADAPTER_BUILD, modules_CookieAdapter as CookieAdapter, type modules_CookieAdapterConfig as CookieAdapterConfig, type modules_CookieOptions as CookieOptions, type modules_HistoryEntry as HistoryEntry, modules_INDEXED_DB_ADAPTER_BUILD as INDEXED_DB_ADAPTER_BUILD, modules_IndexedDBAdapter as IndexedDBAdapter, type modules_IndexedDBAdapterConfig as IndexedDBAdapterConfig, type modules_JSONReplacer as JSONReplacer, type modules_JSONReviver as JSONReviver, modules_LocalStorageAdapter as LocalStorageAdapter, modules_MemoryAdapter as MemoryAdapter, type modules_MemoryAdapterConfig as MemoryAdapterConfig, type modules_ModulePaths as ModulePaths, modules_PERSIST_MODULE_BUILD as PERSIST_MODULE_BUILD, type modules_PersistConfig as PersistConfig, modules_PersistModule as PersistModule, type modules_ReactorModuleConstructor as ReactorModuleConstructor, type modules_ReactorModuleId as ReactorModuleId, modules_SessionStorageAdapter as SessionStorageAdapter, modules_StorageAdapter as StorageAdapter, type modules_StorageAdapterConfig as StorageAdapterConfig, type modules_StorageAdapterConstructor as StorageAdapterConstructor, modules_TIME_TRAVEL_MODULE_BUILD as TIME_TRAVEL_MODULE_BUILD, type modules_TimeTravelConfig as TimeTravelConfig, modules_TimeTravelModule as TimeTravelModule, type modules_TimeTravelState as TimeTravelState };
}

/**
 * Runs a reactive side effect in vanilla JavaScript.
 * The callback executes immediately, tracks accessed state, and re-runs when
 * tracked dependencies change.
 * @param callback Effect callback.
 * @param options Listener options if `sync: false` else Watcher Options.
 * @returns Cleanup function that stops tracking and releases resources.
 * @example
 * const stop = effect(() => console.log(state.count));
 */
declare function effect(callback: () => void, options?: EffectOptions): () => void;

/** Reactive options for the TimeTravel overlay instance. */
interface TimeTravelOverlayConfig {
    /** Header text shown at the top of the overlay panel. */
    title: string;
    /** Accent color used to derive panel theme variables. */
    color: string;
    /** Shows the overlay only in development when true. */
    devOnly: boolean;
    /** Initial open state applied when the overlay is created. */
    startOpen: boolean;
    /** Container element that owns the overlay layer and dock. */
    container: HTMLElement;
}
/**
 * - Vanilla overlay controller for visual time-travel controls and timeline I/O.
 * - Mounts a docked HUD into the configured container, syncs its UI with module state, and forwards keyboard/button actions to the TimeTravelModule.
 * Supports reactive `config` updates (title/color/container/devOnly) and maintains local overlay UI state (`open` and `import` payload text).
 */
declare class TimeTravelOverlay {
    static count: number;
    index: number;
    config: TimeTravelOverlayConfig;
    readonly state: Reactive<{
        open: boolean;
        import: string;
    }, undefined>;
    readonly time: TimeTravelModule;
    readonly els: Record<string, HTMLElement>;
    private clups;
    private keyup?;
    /** Creates a docked TimeTravel overlay bound to a module instance.
     * @param time TimeTravel module instance that owns timeline operations.
     * @param build Optional initial overlay config overrides.
     */
    constructor(time: TimeTravelModule, build?: Partial<TimeTravelOverlayConfig>);
    destroy(): void;
}

type vanilla_Autotracker<T extends object> = Autotracker<T>;
declare const vanilla_Autotracker: typeof Autotracker;
type vanilla_TimeTravelOverlay = TimeTravelOverlay;
declare const vanilla_TimeTravelOverlay: typeof TimeTravelOverlay;
type vanilla_TimeTravelOverlayConfig = TimeTravelOverlayConfig;
declare const vanilla_effect: typeof effect;
declare const vanilla_withTracker: typeof withTracker;
declare namespace vanilla {
  export { vanilla_Autotracker as Autotracker, vanilla_TimeTravelOverlay as TimeTravelOverlay, type vanilla_TimeTravelOverlayConfig as TimeTravelOverlayConfig, vanilla_effect as effect, vanilla_withTracker as withTracker };
}

declare const adapters: {
    vanilla: typeof vanilla;
};

export { type AddDepth, CTX, type ChildPaths, type DeepKeys, type DeepMerge, type DeepPartial, type DeepReadonly, type DeepRequired, type Deleter, type DeleterRecord, type DepthConfig, type DirectPayload, EVT_OPTS, type EffectOptions, type Getter, type GetterRecord, INDIFFABLE, INERTIA, type Inert, type Intent, type Listener, type ListenerOptions, type ListenerOptionsTuple, type ListenerRecord, type Live, type MaxDepth, NIL, NOOP, type NextDepth, type NoTraverse, type PathBranch, type PathBranchValue, type PathDepth, type PathKey, type PathLeaf, type PathValue, type Paths, type Payload, type PrevDepth, type Primitive, RAW, REJECTABLE, type REvent, RTR_BATCH, RTR_LOG, type Reactive, type ReactivePreferences, Reactor, type ReactorBuild, ReactorEvent, SSVERSION, type Setter, type SetterRecord, type Stable, type State, type StrictPathKey, type SubtractDepth, type SyncOptions, type SyncOptionsTuple, TERMINATOR, type Target, type Unflatten, type UnionToIntersection, type UpdatePayload, VERSION, type Volatile, type Watcher, type WatcherRecord, type WildPaths, adapters, getRaw, getSnapshotVersion, getVersion, inert, intent, isInert, isIntent, isVolatile, live, methods, modules, reactive, stable, state, utils, volatile };
