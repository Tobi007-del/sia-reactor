import { d as Reactive } from './index-2jKy98op.js';
import { m as TimeTravelModule } from './timeTravel-CsbQ8qhP.js';

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

export { TimeTravelOverlay as T, type TimeTravelOverlayConfig as a };
