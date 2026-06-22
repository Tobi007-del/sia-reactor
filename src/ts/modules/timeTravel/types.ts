import { Paths, PathValue } from "@defs/obj";
import { ReactorModuleId, ReactorModulePathConfig } from "../base";

/** The DNA of a specific moment in time. Records the 'Desire' (Intent) or the 'Fact' (State). */
export interface HistoryEntry<T extends object = any, P extends Paths<T> = Paths<T>> {
  /** The surgical address in the Reactor */
  path: P;
  /** The data payload at that moment */
  to: PathValue<T, P>;
  /** The "Undo" antidote (Previous value), if applicable */
  from: PathValue<T, P>;
  /** Was it a 'set' or a 'delete' surgery? */
  type: "set" | "delete";
  /** Did the key for the value exist on its parent object? */
  hadKey?: boolean; // optional for lighter payload
  /** For multi-reactor management, identifies who the entry belongs to */
  rid: ReactorModuleId;
  /** Time elapsed since the last chronicled frame */
  deltat: number;
}

/** A container for a group of synchronous or related history nodes, representing a single atomic transaction. */
export interface HistoryTransaction<T extends object = any, P extends Paths<T> = Paths<T>> {
  /** Identifier for the transaction */
  id?: number | string;
  /** Optional label for the transaction, useful for debugging and logging */
  label?: string;
  /** The collection of nodes that make up this atomic transaction */
  nodes: HistoryNode<T, P>[];
  /** Time elapsed since the last chronicled frame. */
  deltat: number;
  /** The timestamp when the transaction began. */
  start: number;
  /** The timestamp when the transaction completed. */
  end: number;
}

/** A distinct tick on the timeline; can be a solitary mutation entry or a grouped atomic transaction. */
export type HistoryNode<T extends object = any, P extends Paths<T> = Paths<T>> = HistoryEntry<T, P> | HistoryTransaction<T, P>;

export interface TimeTravelConfig<T extends object, P extends Paths<T> = Paths<T>> extends Omit<ReactorModulePathConfig<T, P>, "disabled"> {
  /** Maximum number of history frames to keep (Memory Cap). Takes effect on the next entry. @default  `1000000000`. */
  limit: number;
  /** Multiplier for the delay between events during playback (1 = real-time, 2 = double speed, 0.5 = half speed). @default  `1`. */
  playbackRate: number;
  /** Max delay between events during playback (ms). @default  `2000`. */
  maxPlaybackDelay: number;
  /** Hook: Intercept/Modify history entries before they're added to the timeline.
   * @param entry The history entry that is about to be added to the timeline.
   * @param history The reference to the history state, which can be used for context-aware heuristics (e.g., bundling rapid entries).
   * @returns The modified entry to be added, or `false` to block the entry from being added to the timeline.
   */
  beforeEntry?: (entry: HistoryEntry<T, P>, history: Array<HistoryNode<T, P>>) => HistoryEntry<T, P> | boolean;
  /** Hook: Invoked after a history frame (entry or transaction) is applied during teleportation.
   * @param frame The history frame that was applied, which can be either a single entry or a grouped transaction.
   * @param forward A boolean indicating the direction of teleportation, where `true` means moving forward in time and `false` means moving backward in time.
   */
  onApply: (frame: HistoryNode<T, P>, forward: boolean) => void;
}

export interface TimeTravelState<T extends object, P extends Paths<T> = Paths<T>> {
  /** The "Genesis" snapshot (Raw Data) */
  initialState: { [rid: ReactorModuleId]: any };
  /** The "Timeline" of mutations (Chronological Log of Entries and Grouped Transactions) */
  history: Array<HistoryNode<T, P>>;
  /** Whether it is currently chronicling mutations, only for monitoring changes; lies on hydration. */
  tracking: boolean;
  /** The manual playhead (Index in the Timeline) */
  currentFrame: number;
  /** Whether automated playback is currently paused. */
  paused: boolean;
  /** Whether the playhead is moving in the forward direction when playing. */
  forward: boolean;
}
