import type { RedisPoolOptions } from '../client/pool';
import type { FailureDetector } from './failure-detector';
import type { HealthCheck } from './health-check';
import type { FailoverStrategy } from './failover-strategy';

/** Identity + connection options for one member database. */
export interface DatabaseConfig<OPTIONS> {
  /**
   * Stable identifier used across controller methods, descriptors and event
   * payloads; survives add/remove. Generated (`db-<n>`, n = config position)
   * if omitted.
   */
  id?: string;
  /** Unchanged base client options. */
  options: OPTIONS;
  /**
   * Selection weight in [0, 1]; the highest-weight healthy member is active.
   * Default 1 (equal weights).
   */
  weight?: number;
  /** Honored only via `controller.addDatabase`. */
  skipInitialHealthCheck?: boolean;
}

export interface PoolDatabaseConfig<OPTIONS> extends DatabaseConfig<OPTIONS> {
  poolOptions?: Partial<RedisPoolOptions>;
}

/** Aggregation of one round of health-check probes, evaluated with early exit. */
export type ProbePolicy = 'ALL' | 'MAJORITY' | 'ANY';

/** Members that must pass the initial health check for `connect()` to resolve. */
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

/** Thresholds for the default sliding-window failure detector. */
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
  /** health-check chain — all checks must pass. Default: the built-in PING check. */
  healthChecks?: Array<HealthCheck>;
  /** custom detector instance, or thresholds for the default one. */
  failureDetector?: FailureDetector | FailureDetectorConfig;
  failoverStrategy?: FailoverStrategy;
  /** failover attempts before `PermanentlyUnavailableError`. Default 10. */
  maxFailoverAttempts?: number;
  /** ms between failover attempts. Default 12_000. */
  delayBetweenFailoverAttempts?: number;
  /** ms between auto-fallback evaluations; -1 disables (default). */
  autoFallbackInterval?: number;
  /** initial health-check gate for `connect()`. Default 'majority'. */
  initialAvailability?: InitialAvailability;
}

/* -------------------------------------------------------------------------- */
/* Defaults & resolution                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Runtime defaults (single source, pinned by config.spec.ts). The `Default …`
 * notes in the option JSDoc above restate these for IDE hover — update both
 * in the same commit.
 */
export const MULTI_DB_DEFAULTS = {
  gracePeriod: 60_000,
  healthCheck: {
    interval: 5_000,
    timeout: 3_000,
    numProbes: 3,
    delayBetweenProbes: 500,
    policy: 'ALL'
  },
  failureDetector: {
    minNumOfFailures: 1_000,
    failureRateThreshold: 10,
    windowSize: 2_000
  },
  maxFailoverAttempts: 10,
  delayBetweenFailoverAttempts: 12_000,
  autoFallbackInterval: -1,
  initialAvailability: 'majority'
} as const satisfies MultiDbConfig;

export type ResolvedHealthCheckConfig = Required<HealthCheckConfig>;

export interface ResolvedFailureDetectorConfig extends Required<Omit<FailureDetectorConfig, 'errorFilter'>> {
  errorFilter: (err: Error) => boolean;
}

export interface ResolvedMultiDbConfig {
  gracePeriod: number;
  healthCheck: ResolvedHealthCheckConfig;
  /** undefined = the default PING chain (built by the health-check runner). */
  healthChecks?: Array<HealthCheck>;
  failureDetector: FailureDetector | ResolvedFailureDetectorConfig;
  /** undefined = `WeightBasedStrategy`. */
  failoverStrategy?: FailoverStrategy;
  maxFailoverAttempts: number;
  delayBetweenFailoverAttempts: number;
  autoFallbackInterval: number;
  initialAvailability: InitialAvailability;
}

/** Stable per-member identity attached to every database config by resolution. */
export interface ResolvedDatabaseIdentity {
  id: string;
  weight: number;
  skipInitialHealthCheck: boolean;
}

function isFailureDetector(
  detector: FailureDetector | FailureDetectorConfig
): detector is FailureDetector {
  return typeof (detector as FailureDetector).isFaulty === 'function';
}

/**
 * Apply the defaults table and validate: ≥1 database,
 * weights within [0, 1], unique ids (generated per `DatabaseConfig.id` when
 * omitted), health-check timeout below the check interval.
 */
export function resolveMultiDbConfig<DB extends DatabaseConfig<unknown>>(
  databases: Array<DB>,
  config: MultiDbConfig = {}
): {
  databases: Array<DB & ResolvedDatabaseIdentity>;
  config: ResolvedMultiDbConfig;
} {
  if (databases.length < 1) {
    throw new TypeError('MultiDb: at least one database is required');
  }

  const seen = new Set<string>();
  const resolvedDatabases = databases.map((db, index) => {
    const id = db.id ?? `db-${index}`;
    if (seen.has(id)) {
      throw new TypeError(`MultiDb: duplicate database id "${id}"`);
    }
    seen.add(id);

    const weight = db.weight ?? 1;
    // negated form also rejects NaN
    if (!(weight >= 0 && weight <= 1)) {
      throw new TypeError(`MultiDb: database "${id}" weight must be within [0, 1], got ${weight}`);
    }

    return {
      ...db,
      id,
      weight,
      skipInitialHealthCheck: db.skipInitialHealthCheck ?? false
    };
  });

  const healthCheck = { ...MULTI_DB_DEFAULTS.healthCheck, ...config.healthCheck };
  if (!(healthCheck.timeout < healthCheck.interval)) {
    throw new TypeError(
      `MultiDb: healthCheck.timeout (${healthCheck.timeout}) must be less than healthCheck.interval (${healthCheck.interval})`
    );
  }

  const failureDetector = config.failureDetector !== undefined && isFailureDetector(config.failureDetector)
    ? config.failureDetector
    : {
        // not in MULTI_DB_DEFAULTS — the table stays data-only (deep-equal pinned by config.spec.ts)
        errorFilter: () => true,
        ...MULTI_DB_DEFAULTS.failureDetector,
        ...config.failureDetector
      };

  return {
    databases: resolvedDatabases,
    config: {
      gracePeriod: config.gracePeriod ?? MULTI_DB_DEFAULTS.gracePeriod,
      healthCheck,
      healthChecks: config.healthChecks,
      failureDetector,
      failoverStrategy: config.failoverStrategy,
      maxFailoverAttempts: config.maxFailoverAttempts ?? MULTI_DB_DEFAULTS.maxFailoverAttempts,
      delayBetweenFailoverAttempts:
        config.delayBetweenFailoverAttempts ?? MULTI_DB_DEFAULTS.delayBetweenFailoverAttempts,
      autoFallbackInterval: config.autoFallbackInterval ?? MULTI_DB_DEFAULTS.autoFallbackInterval,
      initialAvailability: config.initialAvailability ?? MULTI_DB_DEFAULTS.initialAvailability
    }
  };
}
