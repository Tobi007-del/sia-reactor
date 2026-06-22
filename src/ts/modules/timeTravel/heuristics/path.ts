import { CTX } from "@src/ts/super";
import type { HistoryEntry } from "../types";
import { HeuristicFn } from ".";

/**
 * Compresses multiple identical path writes within a transaction into a single payload.
 *
 * Goals:
 * - Reduce redundant entries in transactions where the same path is updated multiple times.
 * - Preserve the chronological order of first-touch for each unique path.
 *
 * This is designed for any scenario where multiple updates to the same path may occur within a single transaction.
 */
export function createTxPathMerger(): HeuristicFn {
  const activeTxs = new WeakMap<object, Map<string, HistoryEntry>>();

  return (entry: HistoryEntry) => {
    const tx = CTX.meta?.tx;
    if (!tx) return entry;

    // 1. Get or create the isolated tracker for this specific transaction depth
    let txMap = activeTxs.get(tx);
    if (!txMap) activeTxs.set(tx, (txMap = new Map()));

    // 2. Intercept & Compress
    if (txMap.has(entry.path)) {
      const existing = txMap.get(entry.path)!;
      existing.to = entry.to;
      existing.deltat += entry.deltat;
      return false; // Drop duplicate
    }

    // 3. First Touch
    return txMap.set(entry.path, entry), entry;
  };
}
