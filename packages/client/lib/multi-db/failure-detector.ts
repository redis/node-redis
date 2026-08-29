/**
 * Decides when the active member is faulty. Implementations are fed every
 * forwarded command's outcome by the forwarding layer plus member `error`
 * events; a custom implementation can be supplied via
 * `MultiDbConfig.failureDetector`.
 */
export interface FailureDetector {
  onCommandResult(ok: boolean, err?: Error): void;
  /** True = the active member is considered failed; the manager opens its circuit and fails over. */
  isFaulty(): boolean;
  /** Discard all accumulated observations — called when the active member switches so state never spans members. */
  reset(): void;
}
