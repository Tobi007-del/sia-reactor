import { NIL } from "@core/consts";
import type { TextBundlerOptions } from "./types";
import type { HistoryEntry, HistoryNode } from "../../types";
import { matchPaths } from "@src/ts/utils";
import { HeuristicFn } from "..";

/**
 * Ultra-optimized intelligent text history bundler.
 *
 * Goals:
 * - Human-feeling undo steps
 * - Prevent keystroke spam
 * - Preserve semantic typing chunks
 * - Handle rapid typing/backspacing naturally
 * - Avoid pathological giant merges
 *
 * This is designed for editors, inputs, terminals, code editors, note apps, IDEs, etc.
 */
export function createTextBundler({ throttle = 700, boundaryRegex: rgx = /[\s.,!?;:\n()[\]{}'"`]/, maxGrowth = 48, bundleInserts = true, bundleDeletes = true, strictMerges = true, whitelist, blacklist, toString }: TextBundlerOptions = NIL): HeuristicFn {
  return (entry: HistoryEntry, history: HistoryNode[]) => {
    if ((whitelist?.length && !matchPaths(whitelist, entry.path)) || (blacklist?.length && matchPaths(blacklist, entry.path))) return entry;

    const to = toString ? toString(entry.to, entry) : entry.to,
      from = toString ? toString(entry.from, entry) : entry.from;
    if ("string" !== typeof to || "string" !== typeof from) return entry; // Only string diffs

    const last = history[history.length - 1];
    if (!last) return entry; // Empty history
    if ("nodes" in last) return entry; // Don't crack open transactions
    if (last.path !== entry.path) return entry; // Path mismatch

    const lastTo = toString ? toString(last.to, last) : last.to,
      lastFrom = toString ? toString(last.from, last) : last.from;
    if ("string" !== typeof lastTo || "string" !== typeof lastFrom) return entry; // String-only previous

    if (entry.deltat > throttle) return entry; // Time window exceeded

    const prevDelta = lastTo.length - lastFrom.length,
      nextDelta = to.length - from.length,
      op = nextDelta > 0 ? "insert" : nextDelta < 0 ? "delete" : from !== to ? "replace" : "unknown",
      lastOp = prevDelta > 0 ? "insert" : prevDelta < 0 ? "delete" : lastFrom !== lastTo ? "replace" : "unknown";
    if (strictMerges && op !== lastOp) return entry; // Prevent weird typing/delete hybrids
    if (Math.abs(to.length - lastFrom.length) > maxGrowth) return entry; // Prevent gigantic semantic blobs

    // INSERTION or DELETION MERGING
    const isInsert = op === "insert";
    if (isInsert || op === "delete") {
      const bundleOp = isInsert ? bundleInserts : bundleDeletes,
        lastChar = (isInsert ? lastTo : lastFrom).at(-1);
      if (!bundleOp && lastChar && rgx.test(lastChar)) return entry; // If NOT bundling across boundaries, respect em
      history.pop(); // Merge rapid typing
      return { ...entry, from: last.from, deltat: last.deltat + entry.deltat };
    }
    // REPLACEMENTS
    // Usually selection paste / autocomplete / editor transforms. Keep isolated.
    return entry;
  };
}

/**
 * Sets the value of a text input/area and attempts to preserve the cursor position as best as possible.
 * @param el The input/textarea element to update.
 * @param value The new `value` to set. @default  an empty string.
 * @param selStart The start position of the selection.
 * @param selEnd The end position of the selection.
 * @param selDir The direction of the selection.
 */
export function setValueWithCursor(el?: HTMLInputElement | HTMLTextAreaElement | null, value = "", selStart = 0, selEnd = 0, selDir: HTMLInputElement["selectionDirection"] = "none") {
  if (el) (el.value = value), el.setSelectionRange(Math.min(selStart ?? el.selectionStart, value.length), Math.min(selEnd ?? el.selectionEnd, value.length), selDir! ?? el.selectionDirection);
}

export type * from "./types";
