import { EventEmitter } from 'node:events';
import type { AnyRedisClientType } from './index';
import type { MultiDbManager } from './manager';
import type { Database } from './database';
import type { DatabaseRole } from './database';
import type { CircuitState } from './circuit';
import type { PoolDatabaseConfig } from './config';

/** @experimental */
export type FailoverReason = 'failure-detector' | 'health-check' | 'forced' | 'active-removed';

/**
 * Active switched `from` → `to` (database ids) because the active member failed, was removed, or was forced.
 * @experimental
 */
export interface FailoverEvent {
  from: string;
  to: string;
  reason: FailoverReason;
}

/**
 * Auto-fallback returned traffic to a higher-weight healthy member.
 * @experimental
 */
export interface FallbackEvent {
  from: string;
  to: string;
}

/**
 * A member's circuit opened; `cause` is the error that tripped it.
 * @experimental
 */
export interface DatabaseUnhealthyEvent {
  id: string;
  cause: Error;
}

/**
 * A member's circuit closed again after recovery probing.
 * @experimental
 */
export interface DatabaseRecoveredEvent {
  id: string;
}

/**
 * One failed failover attempt while no eligible member exists; `attempt` counts toward `maxFailoverAttempts`.
 * @experimental
 */
export interface AllDatabasesDownEvent {
  attempt: number;
  maxAttempts: number;
}

/** @experimental */
export interface MultiDbControllerEvents {
  'failover': [FailoverEvent];
  'fallback': [FallbackEvent];
  'database-unhealthy': [DatabaseUnhealthyEvent];
  'database-recovered': [DatabaseRecoveredEvent];
  'all-databases-down': [AllDatabasesDownEvent];
  'error': [Error];
}

/**
 * Point-in-time view of one member; raw member clients stay internal.
 * @experimental
 */
export interface DatabaseDescriptor {
  id: string;
  weight: number;
  circuitState: CircuitState;
  role: DatabaseRole;
}

/**
 * The multi-db-only admin surface: topology inspection, weights, active-DB
 * selection, failover events. Kept OFF `client` so `client` stays
 * exactly the base client type.
 * @experimental
 */
export class MultiDbController<C extends AnyRedisClientType> extends EventEmitter {
  // typed event surface — @types/node 20.11 has no generic EventEmitter, so
  // narrow the inherited signatures to the multi-db event map (`declare`
  // emits no code)
  declare on: <E extends keyof MultiDbControllerEvents>(
    event: E,
    listener: (...args: MultiDbControllerEvents[E]) => void
  ) => this;
  declare once: <E extends keyof MultiDbControllerEvents>(
    event: E,
    listener: (...args: MultiDbControllerEvents[E]) => void
  ) => this;
  declare off: <E extends keyof MultiDbControllerEvents>(
    event: E,
    listener: (...args: MultiDbControllerEvents[E]) => void
  ) => this;
  declare emit: <E extends keyof MultiDbControllerEvents>(
    event: E,
    ...args: MultiDbControllerEvents[E]
  ) => boolean;

  #mgr: MultiDbManager<C>;

  /** @internal */
  constructor(mgr: MultiDbManager<C>) {
    super();
    this.#mgr = mgr;
    mgr.bindEvents(this);
  }

  /** descriptor of the member currently receiving commands */
  getActiveDatabase(): DatabaseDescriptor {
    return describe(this.#mgr.activeDatabase);
  }

  /** all managed members, in config order */
  getDatabases(): ReadonlyArray<DatabaseDescriptor> {
    return this.#mgr.databases.map(describe);
  }

  /**
   * Add a member database at runtime. `options` must match the factory this
   * client was created with (`poolOptions` applies to pool members only).
   * Resolves to the member's id once it is connected and — unless
   * `skipInitialHealthCheck` — health-checked; a member that fails to
   * establish stays in the set with an OPEN circuit. Throws `TypeError` on a
   * duplicate id or a weight outside [0, 1].
   */
  addDatabase(config: PoolDatabaseConfig<unknown>): Promise<string> {
    return this.#mgr.addDatabase(config);
  }

  /**
   * Remove a member database. Removing the active member first fails over to
   * the highest-weight healthy replacement. Throws `TypeError` for an unknown
   * id; throws `Error` when removing the last member or when the active
   * member has no healthy replacement — state conditions that may clear after
   * recovery.
   */
  removeDatabase(id: string): Promise<void> {
    return this.#mgr.removeDatabase(id);
  }

  /**
   * Change a member's selection weight, within [0, 1]. Takes effect on the
   * next selection (failover, fallback, removal) — it does not switch the
   * active member by itself.
   */
  setWeight(id: string, weight: number): void {
    this.#mgr.setWeight(id, weight);
  }

  /**
   * Enable or retune the auto-fallback loop: every `intervalMs` the client
   * returns to the highest-weight healthy member when it outweighs the active
   * one, emitting `fallback`. `false` (or a non-positive interval) disables
   * the loop — the default.
   */
  setAutoFallback(intervalMs: number | false): void {
    this.#mgr.setAutoFallback(intervalMs);
  }

  /**
   * Force the active member and pin it. The target must pass a health-check
   * round first; a verified-healthy target's OPEN circuit is closed (operator
   * override). While pinned, auto-fallback is suspended — automatic failover
   * still runs if the pinned member fails, clearing the pin. Throws
   * `TypeError` for an unknown id; throws `Error` when the target fails its
   * health check or the client is permanently unavailable.
   */
  setActiveDatabase(id: string): Promise<void> {
    return this.#mgr.setActiveDatabase(id);
  }

  /** Resume automatic weight-based fallback after a forced pin. */
  releasePin(): void {
    this.#mgr.releasePin();
  }
}

function describe<C extends AnyRedisClientType>(db: Database<C>): DatabaseDescriptor {
  return {
    id: db.id,
    weight: db.weight,
    circuitState: db.circuit.state,
    role: db.role
  };
}
