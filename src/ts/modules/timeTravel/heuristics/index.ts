import type { HistoryEntry, HistoryNode } from "../types";

export type HeuristicFn = (entry: HistoryEntry, history: HistoryNode[]) => HistoryEntry | boolean;

/** Pipes a history entry through multiple heuristics sequentially. If any heuristic returns `false`, the entry is immediately dropped. */
export function composeHeuristics(...heuristics: HeuristicFn[]): HeuristicFn {
  const fns = heuristics.filter(Boolean); // in case you dynamically pass them

  return (entry: HistoryEntry, history: HistoryNode[]) => {
    let current: HistoryEntry | boolean = entry;
    for (let i = 0, len = fns.length; i < len; i++) if ((current = fns[i](current as HistoryEntry, history)) === false) return false;
    return current;
  };
}

export * from "./text";
export * from "./path";
