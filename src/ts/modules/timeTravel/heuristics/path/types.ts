export interface TxPathMergerOptions {
  /** Whether to drop no-op and net-zero mutations inside transactions. @default `true` */
  diffing?: boolean;
}
