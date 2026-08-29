import { EventEmitter } from 'node:events';
import type { AnyRedisClientType } from './index';
import type { MultiDbManager } from './manager';
import type { Database } from './database';
import type { DatabaseRole } from './database';
import type { CircuitState } from './circuit';

export type FailoverReason = 'failure-detector' | 'health-check' | 'forced' | 'active-removed';

/** Active switched `from` → `to` (database ids) because the active member failed, was removed, or was forced. */
export interface FailoverEvent {
  from: string;
  to: string;
  reason: FailoverReason;
}

/** Auto-fallback returned traffic to a higher-weight healthy member. */
export interface FallbackEvent {
  from: string;
  to: string;
}

/** A member's circuit opened; `cause` is the error that tripped it. */
export interface DatabaseUnhealthyEvent {
  id: string;
  cause: Error;
}

/** A member's circuit closed again after recovery probing. */
export interface DatabaseRecoveredEvent {
  id: string;
}

/** One failed failover attempt while no eligible member exists; `attempt` counts toward `maxFailoverAttempts` (FR-013). */
export interface AllDatabasesDownEvent {
  attempt: number;
  maxAttempts: number;
}

export interface MultiDbControllerEvents {
  'failover': [FailoverEvent];
  'fallback': [FallbackEvent];
  'database-unhealthy': [DatabaseUnhealthyEvent];
  'database-recovered': [DatabaseRecoveredEvent];
  'all-databases-down': [AllDatabasesDownEvent];
  'error': [Error];
}

/** Point-in-time view of one member; raw member clients stay internal (FR-024). */
export interface DatabaseDescriptor {
  id: string;
  weight: number;
  circuitState: CircuitState;
  role: DatabaseRole;
}

/**
 * The multi-db-only admin surface: topology inspection, weights, active-DB
 * selection, failover events (FR-018). Kept OFF `client` so `client` stays
 * exactly the base client type.
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
}

function describe<C extends AnyRedisClientType>(db: Database<C>): DatabaseDescriptor {
  return {
    id: db.id,
    weight: db.weight,
    circuitState: db.circuit.state,
    role: db.role
  };
}
