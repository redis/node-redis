import type { AnyRedisClientType } from './index';
import type { Database } from './database';

/**
 * Picks the next active member during failover/fallback. Receives the full
 * member set; implementations must return only a member whose circuit is
 * CLOSED (FR-011). Returning `undefined` means no candidate exists and the
 * caller escalates (FR-013).
 */
export interface FailoverStrategy {
  select<C extends AnyRedisClientType>(
    databases: ReadonlyArray<Database<C>>
  ): Database<C> | undefined;
}
