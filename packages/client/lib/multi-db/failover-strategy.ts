import type { AnyRedisClientType } from './index';
import type { Database } from './database';

/**
 * Picks the next active member during failover/fallback. Only members whose
 * circuit is CLOSED are eligible (FR-011); returning `undefined` means no
 * candidate exists and the caller escalates (FR-013).
 */
export interface FailoverStrategy {
  select<C extends AnyRedisClientType>(
    databases: ReadonlyArray<Database<C>>
  ): Database<C> | undefined;
}
