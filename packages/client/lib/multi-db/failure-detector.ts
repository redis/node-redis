/**
 * Decides when the active member is faulty. Implementations are fed every
 * forwarded command's outcome by the forwarding layer plus member `error`
 * events; a custom implementation can be supplied via
 * `MultiDbConfig.failureDetector` (FR-007).
 */
export interface FailureDetector {
  onCommandResult(ok: boolean, err?: Error): void;
  isFaulty(): boolean;
  reset(): void;
}
