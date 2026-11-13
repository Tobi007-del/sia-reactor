import { HistoryEntry } from "../..";

export interface TextBundlerOptions {
  /** Max delay between edits before a new history frame is started. @default `700`ms */
  throttle?: number;
  /** Characters considered "hard boundaries". Once typed, the current word/thought is committed. @default `/[\s.,!?;:\n()[\]{}'"`]/` */
  boundaryRegex?: RegExp;
  /** Maximum character growth allowed before forcing a split. Prevents giant paragraph histories from becoming one frame. @default `48` */
  maxGrowth?: number;
  /** Merge insertions/typings together across boundaries, `true` for chat apps; `false` for code editors. @default `true` */
  bundleInserts?: boolean;
  /** Merge deletions/backspaces together across boundaries, `true` for most use cases. @default `true` */
  bundleDeletes?: boolean;
  /** Prevent cross-operation merges. Example: typing -> deleting -> typing becomes separate frames. @default `true` */
  strictMerges?: boolean;
  /** Array of paths to explicitly bundle. If set, ONLY these paths are bundled. */
  whitelist?: string[];
  /** Array of paths to exclude from bundling. Checked if whitelist is not provided. */
  blacklist?: string[];
  /** A function to convert the entry value to a string for history tracking. */
  toString?: (value: any, entry: HistoryEntry) => string;
}
