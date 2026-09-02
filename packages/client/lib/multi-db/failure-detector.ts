import type { FailureDetectorConfig } from './config';
import { MULTI_DB_DEFAULTS } from './config';

/**
 * Decides when the active member is faulty. Implementations are fed every
 * forwarded command's outcome by the forwarding layer plus member `error`
 * events; a custom implementation can be supplied via
 * `MultiDbConfig.failureDetector`.
 * @experimental
 */
export interface FailureDetector {
  onCommandResult(ok: boolean, err?: Error): void;
  /** True = the active member is considered failed; the manager opens its circuit and fails over. */
  isFaulty(): boolean;
  /** Discard all accumulated observations — called when the active member switches so state never spans members. */
  reset(): void;
}

/** @experimental */
export interface DefaultFailureDetectorOptions extends FailureDetectorConfig {
  /** injectable time source so the window is testable without timers */
  clock?: () => number;
}

interface Outcome {
  ts: number;
  failed: boolean;
}

/**
 * Sliding-window failure detector: faulty when, within `windowSize`, BOTH the
 * failure count reaches `minNumOfFailures` AND the failure rate reaches
 * `failureRateThreshold` percent. A threshold of 0 disables that condition
 * (count-only / rate-only); at least one failure is always required, so an
 * idle member can never be declared faulty. Errors rejected by `errorFilter`
 * still count as traffic (rate denominator) but not as failures.
 * @experimental
 */
export class DefaultFailureDetector implements FailureDetector {
  readonly #minNumOfFailures: number;
  readonly #failureRateThreshold: number;
  readonly #windowSize: number;
  readonly #errorFilter: (err: Error) => boolean;
  readonly #clock: () => number;

  #outcomes: Array<Outcome> = [];
  #head = 0;
  #failures = 0;

  constructor(options: DefaultFailureDetectorOptions = {}) {
    this.#minNumOfFailures = options.minNumOfFailures ?? MULTI_DB_DEFAULTS.failureDetector.minNumOfFailures;
    this.#failureRateThreshold = options.failureRateThreshold ?? MULTI_DB_DEFAULTS.failureDetector.failureRateThreshold;
    this.#windowSize = options.windowSize ?? MULTI_DB_DEFAULTS.failureDetector.windowSize;
    this.#errorFilter = options.errorFilter ?? (() => true);
    this.#clock = options.clock ?? Date.now;
  }

  onCommandResult(ok: boolean, err?: Error): void {
    const failed = !ok && (err === undefined || this.#errorFilter(err));
    this.#outcomes.push({ ts: this.#clock(), failed });
    if (failed) this.#failures++;
    this.#evict();
  }

  isFaulty(): boolean {
    this.#evict();
    const total = this.#outcomes.length - this.#head;
    if (total === 0 || this.#failures === 0) return false;

    const countReached = this.#minNumOfFailures === 0 || this.#failures >= this.#minNumOfFailures;
    const rateReached = this.#failureRateThreshold === 0
      || (this.#failures / total) * 100 >= this.#failureRateThreshold;
    return countReached && rateReached;
  }

  reset(): void {
    this.#outcomes = [];
    this.#head = 0;
    this.#failures = 0;
  }

  /** drop outcomes at or past the window age; `#head` avoids O(n) shifts on the hot path */
  #evict(): void {
    const cutoff = this.#clock() - this.#windowSize;
    while (this.#head < this.#outcomes.length && this.#outcomes[this.#head].ts <= cutoff) {
      if (this.#outcomes[this.#head].failed) this.#failures--;
      this.#head++;
    }
    if (this.#head > 1024 && this.#head * 2 > this.#outcomes.length) {
      this.#outcomes = this.#outcomes.slice(this.#head);
      this.#head = 0;
    }
  }
}
