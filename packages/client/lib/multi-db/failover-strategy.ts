import type { AnyRedisClientType } from './index';
import type { Database } from './database';

/**
 * Picks the next active member during failover/fallback. Receives the full
 * member set; implementations must return only a member whose circuit is
 * CLOSED. Returning `undefined` means no candidate exists and the
 * caller escalates.
 * @experimental
 */
export interface FailoverStrategy {
  select<C extends AnyRedisClientType>(
    databases: ReadonlyArray<Database<C>>
  ): Database<C> | undefined;
}

/**
 * Default strategy: the highest-weight member with a CLOSED circuit; ties are
 * broken by member order (earlier wins — strict `>` keeps the first).
 * @experimental
 */
export class WeightBasedStrategy implements FailoverStrategy {
  select<C extends AnyRedisClientType>(
    databases: ReadonlyArray<Database<C>>
  ): Database<C> | undefined {
    let best: Database<C> | undefined;
    for (const db of databases) {
      if (db.circuit.state !== 'CLOSED') continue;
      if (!best || db.weight > best.weight) {
        best = db;
      }
    }
    return best;
  }
}
