import { REJECTABLE, INERTIA, INDIFFABLE, TERMINATOR } from "@core/consts";
import { Reactor } from "@core/reactor";
import { ReactorEvent } from "@core/event";
import { Paths, WildPaths, ChildPaths, PathValue, PathBranchValue, PathKey, MaxDepth } from "./obj";
import { Reactive } from "@core/mixins";
import { Transaction } from "@modules/timeTravel/transaction";

// ===========================================================================
// CORE MARKERS & STATE WRAPPERS
// ===========================================================================

/** Marks an object as inert (excluded from proxy handling). */
export type Inert<T> = T & { [INERTIA]?: true };
/** Removes inert marker typing. */
export type Live<T> = T extends Inert<infer U> ? U : T;

/** Marks an object as intent (rejectable). */
export type Intent<T> = T & { [REJECTABLE]?: true };
/** Removes intent marker typing. */
export type State<T> = T extends Intent<infer U> ? U : T;

/** Marks an object as volatile/indiffable. */
export type Volatile<T> = T & { [INDIFFABLE]?: true };
/** Removes volatile marker typing. */
export type Stable<T> = T extends Volatile<infer U> ? U : T;

export type { Reactor };

// ===========================================================================
// EVENT SYSTEM & PAYLOADS
// ===========================================================================

/** Path-scoped value container used by payloads/events. */
export interface Target<T, P extends WildPaths<T> = WildPaths<T>> {
  /** Dotted path for this value. */
  readonly path: P;
  /** Current value at the path. */
  value: PathValue<T, P>;
  /** Previous value at the path (only for `set` and `delete` events). */
  readonly oldValue?: PathValue<T, P>;
  /** Key for the value on it's parent object. */
  readonly key: PathKey<T, P>;
  /** Whether the key for the value existed on the parent object.
   * For accuracy on if `key` was in the `object` rather than checking `oldValue` against `undefined` */
  readonly hadKey: boolean;
  /** Parent-branch value for the path. */
  readonly object: PathBranchValue<T, P>;
}

/** Runtime payload union for mediated operations and update waves (Creates the IDE magic). */
export type Payload<T, P extends WildPaths<T> = WildPaths<T>, D extends number = MaxDepth> =
  | DirectPayload<T, P>
  | UpdatePayload<T, P, D>;

/** Extensible meta shape injected into payloads via `...CTX.meta`. */
export interface ReactorMeta {}
export interface BasePayload<T, P extends WildPaths<T> = WildPaths<T>> extends ReactorMeta {
  /** Current target context for the active propagation path.
   * Same reference to `target`, here for seamless API switches: `watch()` -> `on()`. */
  currentTarget: Target<T, P>;
  /** Root reactive object for this payload. */
  readonly root: T;
  /** The `Reactor` instance that dispatched this payload. */
  readonly reactor: Reactor<T>;
  /** Whether resolve/reject intent semantics are allowed on the event this routes to. */
  readonly rejectable: boolean;
  /** For mediators to signal operation termination but doesn't stop the chain. */
  terminated?: boolean;
}
export interface DirectPayload<T, P extends WildPaths<T> = WildPaths<T>> extends BasePayload<T, P> {
  /** Type of the operation that triggered this payload, `"init"` used only when `init: true` to scope callback inititialization as long as `initType` option is not overriden. */
  type: "init" | "get" | "set" | "delete";
  /** Target context for this payload. */
  readonly target: Target<T, P>;
}
export interface UpdatePayload<
  T,
  P extends WildPaths<T> = WildPaths<T>,
  D extends number = MaxDepth
> extends BasePayload<T, P> {
  /** Type of the operation that triggered this payload, i.e. "update" */
  type: "update";
  /** Target context for this payload. */
  readonly target: Target<T, ChildPaths<T, P, ".", D>>; // Target is strictly one of the child paths!
}

/** Event union with payload-aware overrides for `type`, `path`, and value fields (Creates the IDE magic). */
export type REvent<
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
  /** Original target path for this event instance wave. */
  path: PL["target"]["path"];
  /** Current value at the event target path. */
  value: PL["target"]["value"];
  /** Previous value at the event target path. */
  oldValue: PL["target"]["oldValue"];
}

// ===========================================================================
// REACTIVITY CALLBACKS (The Handlers)
// ===========================================================================

/** Get mediator callback. */
export type Getter<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  payload: Payload<T, P>
) => PathValue<T, P> | undefined;

/** Set mediator callback. */
export type Setter<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  terminated: boolean,
  payload: Payload<T, P>
) => PathValue<T, P> | typeof TERMINATOR | undefined;

/** Delete mediator callback. */
export type Deleter<T, P extends WildPaths<T> = WildPaths<T>> = (
  terminated: boolean,
  payload: Payload<T, P>
) => typeof TERMINATOR | undefined;

/** Watch callback (synchronous path observer). */
export type Watcher<T, P extends WildPaths<T> = WildPaths<T>> = (
  value: PathValue<T, P>,
  payload: Payload<T, P>
) => void;

/** Listener callback (batched/asynchronous by default). */
export type Listener<
  T extends object,
  P extends WildPaths<T> = WildPaths<T>,
  D extends number = MaxDepth
> = (event: REvent<T, P, D>) => void;

// ===========================================================================
// ENGINE RECORDS (Internal Storage)
// ===========================================================================

export type GetterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Getter<T, P>;
} & RecordCleanup &
  SyncOptionsTuple;

export type SetterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Setter<T, P>;
} & RecordCleanup &
  SyncOptionsTuple;

export type DeleterRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Deleter<T, P>;
} & RecordCleanup &
  SyncOptionsTuple;

export type WatcherRecord<T extends object, P extends WildPaths<T> = WildPaths<T>> = {
  cb: Watcher<T, P>;
} & RecordCleanup &
  SyncOptionsTuple;

export type ListenerRecord<
  T extends object,
  P extends WildPaths<T> = WildPaths<T>,
  D extends number = MaxDepth
> = {
  cb: Listener<T, P, D>;
  lDepth?: number; // Listener Depth
} & RecordCleanup &
  ListenerOptionsTuple<D>;

interface RecordCleanup {
  clup: () => boolean | undefined; // Registration Cleanup
  sclup?: () => void; // AbortSignal Cleanup
}

// ===========================================================================
// CONFIGURATION OPTIONS
// ===========================================================================

export interface SyncOptionsTuple {
  /** Whether the callback should only run once. */
  once?: boolean;
  /** Optional `AbortSignal` to automatically handle registration cleanup. */
  signal?: AbortSignal;
  /** Whether to defer activation until the next tick. */
  lazy?: boolean;
  /** Whether to run the callback immediately during registration, "auto" runs only if path exists. */
  init?: boolean | "auto";
  /** Override for the scoped `"init"` type used for watchers and listeners that involves all registered for that path by mutating directly.  */
  initType?: "set" | "delete";
}
/** Tuple-form and shorthand boolean for mediator/watch registrations. */
export type SyncOptions = boolean | SyncOptionsTuple;

export interface ListenerOptionsTuple<D extends number = MaxDepth>
  extends Omit<SyncOptionsTuple, "lazy"> {
  /** Whether to listen on the capture phase against bubble. */
  capture?: boolean;
  /** Maximum path nested depth for event propagation, try `1` if listening to an array with nested objects. */
  depth?: D;
}
/** Tuple-form and shorthand boolean for listener registrations. */
export type ListenerOptions<D extends number = MaxDepth> = boolean | ListenerOptionsTuple<D>;

/** Options accepted by adapter effects (`sync: true` -> watch mode else listener mode). */
export type EffectOptions =
  | (Omit<SyncOptionsTuple, "init"> & { sync: true })
  | (Omit<ListenerOptionsTuple, "init"> & { sync?: false });

/** Reactor bootstrap/build configuration. */
export interface ReactorBuild<T extends object, P extends Paths<T> = Paths<T>> {
  /** 1-time set: Enables debug logging and diagnostics. @default  `false`. */
  debug?: boolean;
  /** Enables cross-realm object detection support (e.g. iframes). @default  `false`. */
  crossRealms?: boolean;
  /** Enables structural-sharing snapshot behavior (requires `referenceTracking: true`). @default  `false`. */
  smartCloning?: boolean;
  /** Enables event bubbling across ancestor paths, disable to use only capturing with one-way loops. @default  `true`. */
  eventBubbling?: boolean;
  /** Enables event capturing across ancestor paths, disable to use only bubbling with one-way loops, `"auto"` is `true` for rejectable events. @default  `"auto"`. */
  eventCapturing?: boolean | "auto";
  /** Enables path lineage tracing for reference lookups on property access (requires `referenceTracking: true`). @default  `false`. */
  lineageTracing?: boolean;
  /** Preserves Reflect trap context; safer with ~8x slowdown in hot paths, allows more types to be proxied (e.g. Classes). @default  `false`. */
  preserveContext?: boolean;
  /** Enables high-resolution timestamps on events only to avoid slowdown, prefer over custom solutions for accuracy @default  `false`. */
  eventTimeStamps?: boolean;
  /** Custom equality used by setters and adapter comparisons @default  `Object.is`. */
  equalityFunction?: (a: any, b: any) => boolean;
  /** Custom batching scheduler for listener notification flushes @default  `queueMicrotask`. */
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
