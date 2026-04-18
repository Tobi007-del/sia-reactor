import { E as EffectOptions } from '../index-2jKy98op.js';
export { A as Autotracker, w as withTracker } from '../index-2jKy98op.js';
export { T as TimeTravelOverlay, a as TimeTravelOverlayConfig } from '../TimeTravelOverlay-fun5VLIo.js';
import '../timeTravel-CsbQ8qhP.js';

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
