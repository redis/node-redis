export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/** Injectable time source so the state machine is testable without timers. */
export type Clock = () => number;

export interface CircuitOptions {
  /** ms an OPEN circuit waits before reporting HALF_OPEN. */
  gracePeriod: number;
  /**
   * consecutive successful probes required for HALF_OPEN → CLOSED. Wired from
   * `config.ts:HealthCheckConfig.numProbes` (manager.ts) — the same knob
   * drives health-check probes-per-round.
   */
  numProbes: number;
  clock?: Clock;
}

/**
 * Per-member circuit breaker (FR-010).
 *
 * ```
 * CLOSED ──(detector threshold OR health check fails)──▶ OPEN
 * OPEN ──(gracePeriod elapsed)──▶ HALF_OPEN
 * HALF_OPEN ──(numProbes consecutive successes)──▶ CLOSED
 * HALF_OPEN ──(probe failure)──▶ OPEN (grace period restarts)
 * ```
 *
 * HALF_OPEN is derived from the clock on read, never stored — the machine
 * holds no timers, callers drive it entirely through the methods below.
 */
export class Circuit {
  readonly #gracePeriod: number;
  readonly #numProbes: number;
  readonly #clock: Clock;
  #state: 'CLOSED' | 'OPEN' = 'CLOSED';
  #openedAt = 0;
  #consecutiveSuccessfulProbes = 0;

  constructor(options: CircuitOptions) {
    this.#gracePeriod = options.gracePeriod;
    this.#numProbes = options.numProbes;
    this.#clock = options.clock ?? Date.now;
  }

  get state(): CircuitState {
    if (this.#state === 'OPEN' && this.#clock() - this.#openedAt >= this.#gracePeriod) {
      return 'HALF_OPEN';
    }
    return this.#state;
  }

  /**
   * Trip the circuit (failure-detector threshold or failed health-check round).
   * While already OPEN this is a no-op — the grace period is NOT extended, so
   * repeated failure signals cannot starve recovery probing. From HALF_OPEN it
   * restarts the grace period. Returns true when the effective state changed.
   */
  open(): boolean {
    if (this.state === 'OPEN') return false;
    this.#state = 'OPEN';
    this.#openedAt = this.#clock();
    this.#consecutiveSuccessfulProbes = 0;
    return true;
  }

  /**
   * Report a successful recovery probe. Counts only while HALF_OPEN; closes the
   * circuit after `numProbes` consecutive successes. Returns true when this
   * probe closed the circuit.
   */
  probeSucceeded(): boolean {
    if (this.state !== 'HALF_OPEN') return false;
    if (++this.#consecutiveSuccessfulProbes >= this.#numProbes) {
      return this.close();
    }
    return false;
  }

  /**
   * Report a failed recovery probe: HALF_OPEN → OPEN with a fresh grace period.
   * Returns true when the effective state changed.
   */
  probeFailed(): boolean {
    return this.open();
  }

  /** Force CLOSED (initial selection, `skipInitialHealthCheck`). Returns true when the state changed. */
  close(): boolean {
    const changed = this.state !== 'CLOSED';
    this.#state = 'CLOSED';
    this.#consecutiveSuccessfulProbes = 0;
    return changed;
  }
}
