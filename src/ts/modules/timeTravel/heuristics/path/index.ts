import { NIL } from "@core/consts";
import type { TxPathMergerOptions } from "./types";
import type { HistoryEntry } from "../../types";
import { HeuristicFn } from "..";

/**
 * Compresses multiple identical path writes within a transaction into a single payload.
 *
 * Goals:
 * - Reduce redundant entries in transactions where the same path is updated multiple times.
 * - Preserve the chronological order of first-touch for each unique path.
 * - Drop no-op mutations where the 'to' and 'from' values are identical.
 *
 * This is designed for any scenario where multiple updates to the same path may occur within a single transaction.
 */
export function createTxPathMerger({ diffing = true }: TxPathMergerOptions = NIL): HeuristicFn {
  const activeTxs = new WeakMap<object, Map<string, HistoryEntry>>();

  return (entry: HistoryEntry, history, e) => {
    if (diffing && e.reactor.config.equalityFunction!(entry.to, entry.from)) return false;
    const tx = e.tx;
    if (!tx) return entry;

    // 1. Get or create the isolated tracker for this specific transaction depth
    let txMap = activeTxs.get(tx);
    !txMap && activeTxs.set(tx, (txMap = new Map()));

    // 2. Intercept & Compress
    if (txMap.has(entry.path)) {
      const existing = txMap.get(entry.path)!;
      existing.to = entry.to;
      existing.deltat += entry.deltat;
      if (!diffing || !e.reactor.config.equalityFunction!(existing.to, existing.from)) return false; // Drop duplicate

      const stack: [any[], any][] = [];
      let p: any = history,
        c = p[p.length - 1];
      while (c && "id" in c && c.id !== tx.id) stack.push([p, c]), (p = c.nodes), (c = p[p.length - 1]);
      if (c && "nodes" in c) {
        const idx = c.nodes.findIndex((n: any) => "path" in n && n.path === entry.path);
        if (idx !== -1) for (c.nodes.splice(idx, 1); c && !c.nodes.length; ) p.pop(), ([p, c] = stack.pop() || []); // a spectacle
      }
      return txMap.delete(entry.path), false; // Drop duplicate
    }

    // 3. First Touch
    return txMap.set(entry.path, entry), entry;
  };
}

export type * from "./types";
