export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Injectable time source so the state machine is testable without timers. */
export type Clock = () => number;

export interface CircuitOptions {
  /** ms an OPEN circuit waits before reporting HALF_OPEN. */
  gracePeriod: number;
  /** consecutive successful probes required for HALF_OPEN → CLOSED. */
  numProbes: number;
  clock?: Clock;
}

/**
 * Per-member circuit breaker (FR-010). Implementation lands with the
 * foundational phase (T007).
 */
export class Circuit {}
