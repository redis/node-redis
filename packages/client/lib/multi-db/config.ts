import type { RedisPoolOptions } from '../client/pool';
import type { FailureDetector } from './failure-detector';
import type { HealthCheck } from './health-check';
import type { FailoverStrategy } from './failover-strategy';

/** Identity + connection options for one member database (FR-001). */
export interface DatabaseConfig<OPTIONS> {
  /**
   * Stable identifier used across controller methods, descriptors and event
   * payloads; survives add/remove. Generated (`db-<n>`, n = config position)
   * if omitted.
   */
  id?: string;
  /** Unchanged base client options (FR-019). */
  options: OPTIONS;
  /**
   * Selection weight in [0, 1]; the highest-weight healthy member is active.
   * Default 1 (equal weights).
   */
  weight?: number;
  /** Honored only via `controller.addDatabase` (FR-005). */
  skipInitialHealthCheck?: boolean;
}

export interface PoolDatabaseConfig<OPTIONS> extends DatabaseConfig<OPTIONS> {
  poolOptions?: Partial<RedisPoolOptions>;
}

/** Aggregation of one round of health-check probes, evaluated with early exit. */
export type ProbePolicy = 'ALL' | 'MAJORITY' | 'ANY';

/** Members that must pass the initial health check for `connect()` to resolve (FR-015). */
export type InitialAvailability = 'all' | 'majority' | 'one';

export interface HealthCheckConfig {
  /** ms between background health-check rounds per member. Default 5000. */
  interval?: number;
  /** ms per-probe timeout; must be < `interval`. Default 3000. */
  timeout?: number;
  /** consecutive successful probes to close a HALF_OPEN circuit / pass a round. Default 3. */
  numProbes?: number;
  /** ms between probes within a round. Default 500. */
  delayBetweenProbes?: number;
  /** probe aggregation policy. Default 'ALL'. */
  policy?: ProbePolicy;
}

/** Thresholds for the default sliding-window failure detector (FR-007). */
export interface FailureDetectorConfig {
  /** minimum failures within the window; 0 = rate-only. Default 1000. */
  minNumOfFailures?: number;
  /** failure rate (%) within the window; 0 = count-only. Default 10. */
  failureRateThreshold?: number;
  /** sliding window size in ms. Default 2000. */
  windowSize?: number;
  /** which errors count as failures. Default: all errors count. */
  errorFilter?: (err: Error) => boolean;
}

/** Flat multi-db options accepted by every factory alongside `databases`. */
export interface MultiDbConfig {
  /** ms an OPEN circuit waits before HALF_OPEN recovery probing. Default 60_000. */
  gracePeriod?: number;
  healthCheck?: HealthCheckConfig;
  /** health-check chain — all checks must pass (FR-008). Default: the built-in PING check. */
  healthChecks?: Array<HealthCheck>;
  /** custom detector instance, or thresholds for the default one (FR-007). */
  failureDetector?: FailureDetector | FailureDetectorConfig;
  failoverStrategy?: FailoverStrategy;
  /** failover attempts before `PermanentlyUnavailableError` (FR-013). Default 10. */
  maxFailoverAttempts?: number;
  /** ms between failover attempts. Default 12_000. */
  delayBetweenFailoverAttempts?: number;
  /** ms between auto-fallback evaluations; -1 disables (default, FR-006). */
  autoFallbackInterval?: number;
  /** initial health-check gate for `connect()`. Default 'majority'. */
  initialAvailability?: InitialAvailability;
}
