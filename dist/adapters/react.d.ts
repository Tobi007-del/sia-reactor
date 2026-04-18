import { E as EffectOptions, R as Reactor, d as Reactive, v as ReactorBuild, D as DeepReadonly, W as WildPaths, e as PathValue } from '../index-2jKy98op.js';
import { useLayoutEffect } from 'react';
import { m as TimeTravelModule } from '../timeTravel-CsbQ8qhP.js';
import { a as TimeTravelOverlayConfig } from '../TimeTravelOverlay-fun5VLIo.js';

/**
 * Subscribes a component to desired Reactor state and returns it.
 * The hook uses access tracking so re-renders occur only when accessed fields change.
 * @typeParam T Root state object type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @param build Optional Reactor build options used when creating a scoped Reactor for plain objects.
 * @returns State for render usage if state is scoped locally or just desired.
 * @example
 * const a = useReactor({ user: { name: "Kosi" } }); // per-component scoped
 * @example
 * const state = reactive({ user: { name: "Kosi" } });
 * const b = useReactor(state);
 * @example
 * const rtr = new Reactor({ user: { name: "Kosi" } });
 * const c = useReactor(rtr);
 */
declare function useReactor<T extends object>(target: T | Reactor<T> | Reactive<T>, options?: EffectOptions, build?: ReactorBuild<T>): T;
/**
 * Subscribes a component to any Reactor state.
 * The hook uses access tracking so re-renders occur only when accessed fields change.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @example
 * useAnyReactor();
 */
declare function useAnyReactor(options?: EffectOptions): void;
/**
 * Subscribes a component to Reactor state and returns a readonly tracked snapshot.
 * Rule of thumb: read from snapshots, mutate the source.
 * The hook uses access tracking so re-renders occur only when accessed fields change.
 * @typeParam T Root state object type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @param build Optional Reactor build options used when creating a scoped Reactor for plain objects.
 * @returns Tracked snapshot snap for render usage.
 * @example
 * const a = useReactorSnapshot({ user: { name: "Kosi" } }); // per-component scoped
 * @example
 * const state = reactive({ user: { name: "Kosi" } });
 * const b = useReactorSnapshot(state);
 * @example
 * const rtr = new Reactor({ user: { name: "Kosi" } });
 * const c = useReactorSnapshot(rtr);
 */
declare function useReactorSnapshot<T extends object>(target: T | Reactor<T> | Reactive<T>, options?: EffectOptions, build?: ReactorBuild<T>): DeepReadonly<T>;

/**
 * Subscribes to a derived slice of Reactor state.
 * The selector runs against the live state and uses the provided equality function
 * to suppress unchanged results.
 * @typeParam T Root state object type.
 * @typeParam R Selector return type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param sel Slice selector.
 * @param eq Equality function used to compare consecutive selector results.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @param build Optional Reactor build options used when creating a scoped Reactor for plain objects.
 * @returns The selected slice.
 * @example
 * const a = useSelector({ user: { name: "Kosi" } }, (s) => s.user.name); // per-component scoped
 * @example
 * const state = reactive({ user: { name: "Kosi" } });
 * const b = useSelector(state, (s) => s.user.name);
 * @example
 * const rtr = new Reactor({ user: { name: "Kosi" } });
 * const c = useSelector(rtr, (s) => s.user.name);
 */
declare function useSelector<T extends object, R>(target: T | Reactor<T> | Reactive<T>, sel: (state: T) => R, eq?: (prev: R | undefined, next: R) => boolean, options?: EffectOptions, build?: ReactorBuild<T>): R;
/**
 * Subscribes to a derived slice of any Reactor state.
 * The selector runs against the live state and uses the provided equality function
 * to suppress unchanged results.
 * @typeParam R Selector return type.
 * @param sel Slice selector.
 * @param eq Equality function used to compare consecutive selector results.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @returns The selected slice.
 */
declare function useAnySelector<R>(sel: () => R, eq?: (value1: any, value2: any) => boolean, options?: EffectOptions): R;
/**
 * Subscribes to a derived slice of Reactor state.
 * The selector runs against a readonly tracked snapshot and uses the provided equality function
 * to suppress unchanged results.
 * @typeParam T Root state object type.
 * @typeParam R Selector return type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param sel Slice selector.
 * @param eq Equality function used to compare consecutive selector results.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @param build Optional Reactor build options used when creating a scoped Reactor for plain objects.
 * @returns The selected slice.
 * @example
 * const a = useSelectorSnapshot({ user: { name: "Kosi" } }, (s) => s.user.name); // per-component scoped
 * @example
 * const state = reactive({ user: { name: "Kosi" } });
 * const b = useSelectorSnapshot(state, (s) => s.user.name);
 * @example
 * const rtr = new Reactor({ user: { name: "Kosi" } });
 * const c = useSelectorSnapshot(rtr, (s) => s.user.name);
 */
declare function useSelectorSnapshot<T extends object, R>(target: T | Reactor<T> | Reactive<T>, sel: (state: DeepReadonly<T>) => R, eq?: (value1: any, value2: any) => boolean, options?: EffectOptions, build?: ReactorBuild<T>): R;

/**
 * Subscribes to a single path in Reactor state.
 * Uses sync watcher mode when `options.sync` is enabled; otherwise uses event listeners.
 * @typeParam T Root state object type.
 * @typeParam P Path or wildcard path type.
 * @param target Reactive object, Reactor instance, or plain object.
 * @param path Path to observe. Supports dotted paths and wildcard `"*"`.
 * @param options Watcher options if `options.sync: false` else Listener options.
 * @param build Optional Reactor build options used when creating a scoped Reactor for plain objects.
 * @returns Current value at the requested path.
 * @example
 * const a = usePath({ user: { profile: { name: "Kosi" } } }, "user.profile.name");
 * @example
 * const state = reactive({ user: { profile: { name: "Kosi" } } });
 * const b = usePath(state, "user.profile.name");
 * @example
 * const rtr = new Reactor({ user: { profile: { name: "Kosi" } } });
 * const c = usePath(rtr, "user.profile.name");
 * @example
 * const wholeState = usePath(state, "*");
 */
declare function usePath<T extends object, P extends WildPaths<T>>(target: T | Reactor<T> | Reactive<T>, path: P, options?: EffectOptions, build?: ReactorBuild<T>): PathValue<T, P>;

/** Isomorphic layout effect alias (`useLayoutEffect` in browser, `useEffect` otherwise). */
declare const useISOLayoutEffect: typeof useLayoutEffect;

/** React props for controlling the vanilla TimeTravel overlay. */
interface TimeTravelOverlayProps extends Partial<TimeTravelOverlayConfig> {
    /** Module instance controlled by this overlay bridge. */
    time: TimeTravelModule;
}
/**
 - React bridge for mounting and controlling a vanilla TimeTravelOverlay instance.
 - Instantiates a `TimeTravelOverlay` for the provided module, tears it down on unmount, and syncs prop changes into reactive `config`.
 * Use this when your app is React but you want the overlay behavior with react-safe instance lifecycle management.
 * @param props Overlay bridge props.
 */
declare function TimeTravelOverlay(props: TimeTravelOverlayProps): null;

export { TimeTravelOverlay, type TimeTravelOverlayProps, useAnyReactor, useAnySelector, useISOLayoutEffect, usePath, useReactor, useReactorSnapshot, useSelector, useSelectorSnapshot };
