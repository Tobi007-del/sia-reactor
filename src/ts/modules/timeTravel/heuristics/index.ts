import type { HistoryEntry, HistoryNode } from "../types";

import type { Payload, REvent } from "@defs/reactor";

export type HeuristicFn = (entry: HistoryEntry, history: HistoryNode[], event: REvent<any, any> | Payload<any, any>) => HistoryEntry | boolean;

/** Pipes a history entry through multiple heuristics sequentially. If any heuristic returns `false`, the entry is immediately dropped. */
export function composeHeuristics(...heuristics: HeuristicFn[]): HeuristicFn {
  const fns = heuristics.filter(Boolean); // in case you dynamically pass them

  return (entry: HistoryEntry, history: HistoryNode[], event: REvent<any, any> | Payload<any, any>) => {
    let current: HistoryEntry | boolean = entry;
    for (let i = 0, len = fns.length; i < len; i++) if ((current = fns[i](current as HistoryEntry, history, event)) === false) return false;
    return current;
  };
}

export * from "./text";
export * from "./path";
