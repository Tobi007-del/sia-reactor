import { E as EffectOptions } from '../index-2jKy98op.cjs';
export { A as Autotracker, w as withTracker } from '../index-2jKy98op.cjs';
export { T as TimeTravelOverlay, a as TimeTravelOverlayConfig } from '../TimeTravelOverlay-_6k5wu1I.cjs';
import '../timeTravel-DzgX8BKQ.cjs';

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

export { effect };
