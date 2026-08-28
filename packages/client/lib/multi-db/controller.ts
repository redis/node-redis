import { EventEmitter } from 'node:events';
import type { AnyRedisClientType } from './index';
import type { MultiDbManager } from './manager';

/**
 * The multi-db-only admin surface: topology inspection, weights, active-DB
 * selection, failover events. Kept OFF `client` so `client` stays exactly the
 * base client type.
 */
export class MultiDbController<C extends AnyRedisClientType> extends EventEmitter {
  #mgr: MultiDbManager<C>;

  /** @internal */
  constructor(mgr: MultiDbManager<C>) {
    super();
    this.#mgr = mgr;
  }

  /** the DB currently receiving commands */
  getActiveDatabase(): C {
    return this.#mgr.active;
  }

  /** all managed DBs, in config order */
  getDatabases(): ReadonlyArray<C> {
    return this.#mgr.clients;
  }
}
