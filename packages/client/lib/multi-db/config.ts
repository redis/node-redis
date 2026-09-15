import type { RedisPoolOptions } from '../client/pool';
import type { FailureDetector } from './failure-detector';
import type { HealthCheck } from './health-check';
// value import, but health-check's own config imports are type-only — no cycle
import { probeRoundBudget } from './health-check';
import type { FailoverStrategy } from './failover-strategy';

/**
 * Identity + connection options for one member database.
 * @experimental
 */
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

/** @experimental */
export interface PoolDatabaseConfig<OPTIONS> extends DatabaseConfig<OPTIONS> {
  poolOptions?: Partial<RedisPoolOptions>;
}

/**
 * Aggregation of one round of health-check probes, evaluated with early exit.
 * @experimental
 */
export type ProbePolicy = 'ALL' | 'MAJORITY' | 'ANY';

/**
 * Members that must pass the initial health check for `connect()` to resolve.
 * @experimental
 */
export type InitialAvailability = 'ALL' | 'MAJORITY' | 'ONE';

/** @experimental */
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

/**
 * Thresholds for the default sliding-window failure detector.
 * @experimental
 */
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

/**
 * Flat multi-db options accepted by every factory alongside `databases`.
 * @experimental
 */
export interface MultiDbConfig {
  /** ms an OPEN circuit waits before HALF_OPEN recovery probing. Default 60_000. */
  gracePeriod?: number;
  healthCheck?: HealthCheckConfig;
  /** health-check chain — all checks must pass. Default: the built-in PING check. */
  healthChecks?: Array<HealthCheck>;
  /**
   * Custom detector: an instance, a factory, or thresholds for the default
   * one. Pass a FACTORY when the client will be duplicate()d — the detector is
   * stateful and each clone must get its own; duplicate() refuses a raw
   * instance for that reason.
   */
  failureDetector?: FailureDetector | (() => FailureDetector) | FailureDetectorConfig;
  failoverStrategy?: FailoverStrategy;
  /** failover attempts before `PermanentlyUnavailableError`. Default 10. */
  maxFailoverAttempts?: number;
  /** ms between failover attempts. Default 12_000. */
  delayBetweenFailoverAttempts?: number;
  /** ms between auto-fallback evaluations; -1 disables (default). */
  autoFallbackInterval?: number;
  /** initial health-check gate for `connect()`. Default 'MAJORITY'. */
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
  initialAvailability: 'MAJORITY'
} as const satisfies MultiDbConfig;

/**
 * Node clamps setTimeout/setInterval delays above 2^31-1 (and Infinity) to
 * 1 ms — an accidental "never" would turn into a hot loop, so every duration
 * option is bounded by this.
 */
export const MAX_TIMER_MS = 2 ** 31 - 1;

export type ResolvedHealthCheckConfig = Required<HealthCheckConfig>;

export interface ResolvedFailureDetectorConfig extends Required<Omit<FailureDetectorConfig, 'errorFilter'>> {
  errorFilter: (err: Error) => boolean;
}

export interface ResolvedMultiDbConfig {
  gracePeriod: number;
  healthCheck: ResolvedHealthCheckConfig;
  /** undefined = the default PING chain (built by the health-check runner). */
  healthChecks?: Array<HealthCheck>;
  failureDetector: FailureDetector | (() => FailureDetector) | ResolvedFailureDetectorConfig;
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

export function isFailureDetector(
  detector: FailureDetector | FailureDetectorConfig
): detector is FailureDetector {
  const candidate = detector as FailureDetector;
  const methods = [candidate.isFaulty, candidate.onCommandResult, candidate.reset];
  const present = methods.filter(method => typeof method === 'function').length;
  if (present === methods.length) return true;
  if (present > 0) {
    // half a detector would be accepted as a thresholds object and silently
    // replaced by the default detector — or worse, break on the command path
    throw new TypeError(
      'MultiDb: a custom failure detector must implement isFaulty, onCommandResult and reset'
    );
  }
  return false;
}

/**
 * Resolve one member's identity: apply `fallbackId` when no id is given,
 * default the weight to 1 and validate it is within [0, 1]. Uniqueness is the
 * caller's concern.
 */
export function resolveDatabaseIdentity<DB extends DatabaseConfig<unknown>>(
  db: DB,
  fallbackId: string
): DB & ResolvedDatabaseIdentity {
  const weight = db.weight ?? 1;
  // negated form also rejects NaN
  if (!(weight >= 0 && weight <= 1)) {
    throw new TypeError(`MultiDb: database "${db.id ?? fallbackId}" weight must be within [0, 1], got ${weight}`);
  }
  // invalidation pushes fire on the hidden member client and cannot be
  // forwarded soundly across a switch (the new member has no server-side
  // tracking for keys cached via the old one) — reject instead of silently
  // dropping them; per-member clientSideCache is the supported mode. Checked
  // here so runtime adds get the same guard as initial members.
  if ((db.options as { emitInvalidate?: boolean } | undefined)?.emitInvalidate) {
    throw new TypeError(
      `MultiDb: database "${db.id ?? fallbackId}" sets emitInvalidate, which is not supported on ` +
      'multi-db members — use clientSideCache per member instead'
    );
  }

  return {
    ...db,
    id: db.id ?? fallbackId,
    weight,
    skipInitialHealthCheck: db.skipInitialHealthCheck ?? false
  };
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
    const resolved = resolveDatabaseIdentity(db, `db-${index}`);
    if (seen.has(resolved.id)) {
      throw new TypeError(`MultiDb: duplicate database id "${resolved.id}"`);
    }
    seen.add(resolved.id);
    return resolved;
  });

  const healthCheck = { ...MULTI_DB_DEFAULTS.healthCheck, ...config.healthCheck };
  // negated comparisons also reject NaN; interval > 0 follows from these two
  if (!(healthCheck.timeout > 0)) {
    throw new TypeError(`MultiDb: healthCheck.timeout must be greater than 0, got ${healthCheck.timeout}`);
  }
  if (!(healthCheck.timeout < healthCheck.interval)) {
    throw new TypeError(
      `MultiDb: healthCheck.timeout (${healthCheck.timeout}) must be less than healthCheck.interval (${healthCheck.interval})`
    );
  }
  // the negated form also rejects Infinity (timeout is bounded by interval)
  if (!(healthCheck.interval <= MAX_TIMER_MS)) {
    throw new TypeError(`MultiDb: healthCheck.interval must be <= ${MAX_TIMER_MS}, got ${healthCheck.interval}`);
  }
  if (!(Number.isInteger(healthCheck.numProbes) && healthCheck.numProbes >= 1)) {
    throw new TypeError(`MultiDb: healthCheck.numProbes must be an integer >= 1, got ${healthCheck.numProbes}`);
  }
  if (!(healthCheck.delayBetweenProbes >= 0 && healthCheck.delayBetweenProbes <= MAX_TIMER_MS)) {
    throw new TypeError(
      `MultiDb: healthCheck.delayBetweenProbes must be within [0, ${MAX_TIMER_MS}], got ${healthCheck.delayBetweenProbes}`
    );
  }
  if (!(['ALL', 'MAJORITY', 'ANY'] as Array<string>).includes(healthCheck.policy)) {
    // an unknown policy fails every probe round (fail-closed) with nothing
    // pointing at the typo
    throw new TypeError(`MultiDb: healthCheck.policy must be one of ALL | MAJORITY | ANY, got ${healthCheck.policy}`);
  }
  // each duration is bounded above, but their combination feeds one timer too:
  // the probe-round budget bounds member connects, and a product past the
  // timer max would clamp every connect attempt to 1ms
  const roundBudget = probeRoundBudget(healthCheck);
  if (!(roundBudget <= MAX_TIMER_MS)) {
    throw new TypeError(
      `MultiDb: the health-check round budget (numProbes * timeout + delays between probes = ${roundBudget}) ` +
      `must be <= ${MAX_TIMER_MS}`
    );
  }
  // an empty array would silently disable probing instead of falling back to the default check
  if (config.healthChecks !== undefined && config.healthChecks.length === 0) {
    throw new TypeError('MultiDb: healthChecks must not be empty; omit it to use the default PING check');
  }

  // a factory passes through untouched — each manager invokes it for its own
  // instance (duplicate() relies on this)
  const failureDetector = typeof config.failureDetector === 'function'
    ? config.failureDetector
    : config.failureDetector !== undefined && isFailureDetector(config.failureDetector)
      ? config.failureDetector
      : {
          // not in MULTI_DB_DEFAULTS — the table stays data-only (deep-equal pinned by config.spec.ts)
          errorFilter: () => true,
          ...MULTI_DB_DEFAULTS.failureDetector,
          ...config.failureDetector
        };
  if (typeof failureDetector !== 'function' && !isFailureDetector(failureDetector)) {
    // negated comparisons also reject NaN, here and below
    if (!(failureDetector.minNumOfFailures >= 0)) {
      throw new TypeError(`MultiDb: failureDetector.minNumOfFailures must be >= 0, got ${failureDetector.minNumOfFailures}`);
    }
    if (!(failureDetector.failureRateThreshold >= 0 && failureDetector.failureRateThreshold <= 100)) {
      throw new TypeError(`MultiDb: failureDetector.failureRateThreshold must be within [0, 100], got ${failureDetector.failureRateThreshold}`);
    }
    // windowSize <= 0 would evict every outcome immediately — organic
    // detection silently off
    if (!(failureDetector.windowSize > 0)) {
      throw new TypeError(`MultiDb: failureDetector.windowSize must be greater than 0, got ${failureDetector.windowSize}`);
    }
  }

  const gracePeriod = config.gracePeriod ?? MULTI_DB_DEFAULTS.gracePeriod;
  // NaN would keep an OPEN circuit from ever reaching HALF_OPEN — a tripped
  // member could never recover; Infinity means the same thing, spelled nicer
  if (!(gracePeriod >= 0 && gracePeriod <= MAX_TIMER_MS)) {
    throw new TypeError(`MultiDb: gracePeriod must be within [0, ${MAX_TIMER_MS}], got ${gracePeriod}`);
  }
  const maxFailoverAttempts = config.maxFailoverAttempts ?? MULTI_DB_DEFAULTS.maxFailoverAttempts;
  // 0, negative or NaN would skip the search loop entirely: permanently
  // unavailable without a single retry
  if (!(Number.isInteger(maxFailoverAttempts) && maxFailoverAttempts >= 1)) {
    throw new TypeError(`MultiDb: maxFailoverAttempts must be an integer >= 1, got ${maxFailoverAttempts}`);
  }
  const delayBetweenFailoverAttempts =
    config.delayBetweenFailoverAttempts ?? MULTI_DB_DEFAULTS.delayBetweenFailoverAttempts;
  if (!(delayBetweenFailoverAttempts >= 0 && delayBetweenFailoverAttempts <= MAX_TIMER_MS)) {
    throw new TypeError(
      `MultiDb: delayBetweenFailoverAttempts must be within [0, ${MAX_TIMER_MS}], got ${delayBetweenFailoverAttempts}`
    );
  }
  const autoFallbackInterval = config.autoFallbackInterval ?? MULTI_DB_DEFAULTS.autoFallbackInterval;
  // NaN would slip past the "<= 0 disables" check and setInterval(NaN)
  // coerces to a 1ms hot loop — as does Infinity; -1 is the documented
  // disabled value
  if (!(autoFallbackInterval >= -1 && autoFallbackInterval <= MAX_TIMER_MS)) {
    throw new TypeError(`MultiDb: autoFallbackInterval must be within [-1, ${MAX_TIMER_MS}], got ${autoFallbackInterval}`);
  }
  const initialAvailability = config.initialAvailability ?? MULTI_DB_DEFAULTS.initialAvailability;
  // an unknown value would make requiredHealthy() return undefined and the
  // connect() gate (healthy.length < undefined is false) silently degrade to
  // "one healthy member is enough"
  if (!(['ALL', 'MAJORITY', 'ONE'] as Array<string>).includes(initialAvailability)) {
    throw new TypeError(`MultiDb: initialAvailability must be one of ALL | MAJORITY | ONE, got ${initialAvailability}`);
  }

  return {
    databases: resolvedDatabases,
    config: {
      gracePeriod,
      healthCheck,
      healthChecks: config.healthChecks,
      failureDetector,
      failoverStrategy: config.failoverStrategy,
      maxFailoverAttempts,
      delayBetweenFailoverAttempts,
      autoFallbackInterval,
      initialAvailability
    }
  };
}
