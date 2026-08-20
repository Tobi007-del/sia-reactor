import { ReactorBuild, ReactorMeta } from "@defs/reactor";
import { Autotracker } from "@adapters/autotracker";

// ===========================================================================
// The S.I.A (State & Intent Architecture) Constants
// ===========================================================================

/** Marker to access underlying raw object from a proxy. */
export const RAW: unique symbol = Symbol.for("S.I.A_RAW"); // "Get Original Obj" Marker
/** Marker to opt an object out of reactor proxy handling. */
export const INERTIA: unique symbol = Symbol.for("S.I.A_INERTIA"); // "No Proxy" Marker
/** Marker to mark a branch as intent (rejectable). */
export const REJECTABLE: unique symbol = Symbol.for("S.I.A_REJECTABLE"); // "State Vs. Intent" Marker
/** Marker to enable indifference/non-equality semantics for a branch. */
export const INDIFFABLE: unique symbol = Symbol.for("S.I.A_INDIFFABLE"); // "Equality Tracking" Marker
/** Sentinel return value that terminates a mediated operation. */
export const TERMINATOR: unique symbol = Symbol.for("S.I.A_TERMINATOR"); // "Obj Operation Terminator" Marker
/** Internal mutation version marker. */
export const VERSION: unique symbol = Symbol.for("S.I.A_VERSION"); // "Obj Mutation Count" Marker
/** Internal snapshot version marker used by smart cloning. */
export const SSVERSION: unique symbol = Symbol.for("S.I.A_SNAPSHOT_VERSION"); // "Obj Snapshot Version" Marker
/** Default batching scheduler used by the reactor runtime. */
export const RTR_BATCH = "undefined" !== typeof window ? ("undefined" !== typeof queueMicrotask ? queueMicrotask : setTimeout).bind(window) : "undefined" !== typeof process && process.nextTick ? process.nextTick : setTimeout;
/** Default reactor logger prefix function. */
export const RTR_LOG = console.log.bind(console, "[S.I.A Reactor]");
/** Canonical option keys parsed for listener and mediator registrations. */
export const EVT_OPTS = { LISTENER: ["capture", "depth", "once", "signal", "init"], MEDIATOR: ["lazy", "signal", "init"] } as const;
/** Frozen empty object used as a zero-allocation default options value. */
export const NIL = Object.freeze({}) as any; // empty obj to escape any optional chain overhead
/** Shared no-operation function. */
export const NOOP = () => {}; // no operation function to escape optional chain overhead

let isDevEnv = false;
try {
  isDevEnv = process.env.NODE_ENV !== "production";
} catch (e) {}
const CTX_BUILD = {
  /** Flag indicating whether the application is running in development mode. */
  isDevEnv,
  /** Flag indicating whether an operation is bypassing checks so reactors can allow all writes. */
  usingForce: false,
  /** Active `Autotracker` instance, override for automatic dependency collection on `Reactor` traps. */
  autotracker: null as Autotracker<any> | null,
  /** Extensible meta context for payloads and cross-cutting concerns. */
  meta: null as ReactorMeta | null,
  /** Default configuration for new `Reactor` instances and also fallback for utils that need and are called without these options. */
  defaults: {
    crossRealms: false,
    smartCloning: false,
    eventBubbling: true,
    eventCapturing: "auto",
    lineageTracing: false,
    preserveContext: false,
    equalityFunction: Object.is,
    batchingFunction: RTR_BATCH,
  } as Partial<ReactorBuild<any>>,
};

/** Global context object for sharing state across the reactor runtime. */
export const CTX: typeof CTX_BUILD = ((globalThis as any)[Symbol.for("S.I.A_CTX")] ??= CTX_BUILD);
