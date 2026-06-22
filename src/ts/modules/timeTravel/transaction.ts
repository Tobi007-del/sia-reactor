import { CTX } from "@core/consts";
import { resetMeta } from "@utils/obj";

/** Transaction object representing a unit of work in the reactor system. */
export interface Transaction {
  /** Unique identifier for the transaction, an auto-incrementing number. */
  id: number;
  /** Optional label for the transaction, useful for debugging and logging purposes. */
  label?: string;
  /** Reference to the parent transaction, allowing for nested transaction stacking. */
  parent: Transaction | null;
}

/** Global transaction ID counter, incremented with each new transaction. */
export let txId = 0;

/**
 * Starts a new transaction with an optional label. Transactions are used to group related operations together,
 * allowing for better tracking and debugging of state changes within the reactor system.
 * @param label Optional label for the transaction, useful for debugging and logging purposes.
 * @returns The newly created transaction object.
 */
export function startTx(label = `Tx ${txId + 1}`): Transaction {
  const parent = CTX.meta?.tx ?? null,
    tx: Transaction = { id: ++txId, label, parent };
  CTX.meta ??= {};
  return (CTX.meta.tx = tx);
}

/**
 * Ends the given transaction, reverting the current transaction context to its parent. This should be called after the operations within the transaction are completed to ensure proper cleanup and state management.
 * @param tx The transaction to end.
 */
export function endTx(tx: Transaction) {
  if (CTX.meta?.tx === tx) {
    if (tx.parent) CTX.meta.tx = tx.parent;
    else resetMeta("tx");
  };
}

/**
 * Executes a function within a new transaction context. This is a convenient way to ensure that all operations within the function are grouped together in a single transaction, allowing for better tracking and debugging of state changes.
 * @param fn The function to execute within the transaction context.
 * @param label Optional label for the transaction, useful for debugging and logging purposes.
 * @returns The result of the function execution.
 */
export function transaction<T>(fn: () => T, label?: string): T {
  const tx = startTx(label);
  try {
    return fn();
  } finally {
    endTx(tx);
  }
}

declare module "@defs/reactor" {
  interface ReactorMeta {
    /** Transaction context for this payload, `null` if outside of a transaction. */
    tx?: Transaction | null;
  }
}
