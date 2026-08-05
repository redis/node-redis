import { EventEmitter } from 'node:events';
import RedisClient, { RedisClientType, RedisClientOptions } from '../client';
import { RedisClientPool, RedisClientPoolType, RedisPoolOptions } from '../client/pool';
import RedisCluster, { RedisClusterType, RedisClusterOptions } from '../cluster';
import RedisSentinel from '../sentinel';
import { RedisSentinelType, RedisSentinelOptions } from '../sentinel/types';
import { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';

/**
 * SKETCH — type mechanics only. No failover / health / routing logic yet.
 *
 * Each factory returns `{ client, controller }`:
 *
 *   - `client`    — typed EXACTLY as the underlying client (`RedisClientType`,
 *                   `RedisClusterType`, ...). A true drop-in: any code/type that
 *                   expects the base client accepts it unchanged. Its command
 *                   methods forward to the active DB; its `connect`/`close`/
 *                   `destroy`/`quit` are intercepted to fan out across all DBs.
 *   - `controller`— the multi-db-only surface (topology, weights, active-DB
 *                   selection, failover events). Kept OFF `client` so `client`
 *                   stays exactly the base type.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Every client shape the multi-db layer can wrap. */
export type AnyRedisClientType =
  | RedisClientType<any, any, any, any, any>
  | RedisClientPoolType<any, any, any, any, any>
  | RedisClusterType<any, any, any, any, any>
  | RedisSentinelType<any, any, any, any, any>;

/** Lifecycle members the multi-db layer intercepts (fan-out) rather than forwarding to one DB. */
const INTERCEPTED = new Set<PropertyKey>(['connect', 'close', 'destroy', 'quit']);

export interface MultiDbResult<C extends AnyRedisClientType> {
  /** drop-in: exactly the base client type */
  client: C;
  /** multi-db admin surface */
  controller: MultiDbController<C>;
}

interface DatabaseConfig<OPTIONS> {
  options: OPTIONS;
  /** highest healthy weight = active DB */
  weight?: number;
}

interface PoolDatabaseConfig<OPTIONS> extends DatabaseConfig<OPTIONS> {
  poolOptions?: Partial<RedisPoolOptions>;
}

/* -------------------------------------------------------------------------- */
/* Manager — owns the underlying clients + active selection                   */
/* -------------------------------------------------------------------------- */

class MultiDbManager<C extends AnyRedisClientType> {
  readonly clients: ReadonlyArray<C>;
  active: C;

  constructor(clients: Array<C>) {
    this.clients = clients;
    this.active = clients[0]; // failover selection stubbed
  }

  async connect(): Promise<void> {
    await Promise.all(this.clients.map(c => c.connect()));
  }

  async close(): Promise<void> {
    await Promise.all(this.clients.map(c => c.close()));
  }

  destroy(): void {
    for (const c of this.clients) c.destroy();
  }

  async quit(): Promise<void> {
    // no per-DB quit fan-out subtleties for the sketch; treat like close
    await this.close();
  }
}

/* -------------------------------------------------------------------------- */
/* client — the drop-in surface (typed exactly as C)                          */
/* -------------------------------------------------------------------------- */

/**
 * Lifecycle base. `connect`/`close`/`destroy`/`quit` are real methods (fan-out),
 * NOT forwarded to one DB. Everything else is patched on by `attachForwarders`.
 */
class MultiDbClientBase<C extends AnyRedisClientType> {
  /** @internal read by the forwarders patched below */
  readonly _mgr: MultiDbManager<C>;

  constructor(mgr: MultiDbManager<C>) {
    this._mgr = mgr;
  }

  connect() {
    return this._mgr.connect().then(() => this);
  }

  close() {
    return this._mgr.close();
  }

  destroy() {
    this._mgr.destroy();
  }

  quit() {
    return this._mgr.quit();
  }
}

/**
 * Patch command methods + module/function namespaces onto `target`, forwarding
 * each to the ACTIVE DB. Same shape as `attachConfig` — real (own) properties,
 * no runtime trap — but discovered by walking a representative built client's
 * prototype chain instead of a command registry (kind-agnostic; avoids
 * importing each kind's registry + private executor). Runs ONCE at construction;
 * the closures read `mgr.active` at CALL time, so the method SET is fixed
 * (homogeneous DBs) while the TARGET tracks failover.
 */
function attachForwarders<C extends AnyRedisClientType>(
  target: MultiDbClientBase<C>,
  mgr: MultiDbManager<C>
): void {
  const skip = new Set<PropertyKey>([...INTERCEPTED, 'constructor']);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic patching
  const dst = target as any;

  for (let proto = Object.getPrototypeOf(mgr.active); proto && proto !== Object.prototype; proto = Object.getPrototypeOf(proto)) {
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (skip.has(name)) continue;
      skip.add(name); // most-derived wins; don't reattach shadowed base members

      const desc = Object.getOwnPropertyDescriptor(proto, name)!;
      if (desc.get) {
        // namespace (`json`, `ts`) or computed prop (`isOpen`) → read from active
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic
        Object.defineProperty(dst, name, { get: () => (mgr.active as any)[name], enumerable: false });
      } else if (typeof desc.value === 'function') {
        // command / script method → call active's own method (this = active)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic
        dst[name] = (...args: Array<unknown>) => (mgr.active as any)[name](...args);
      }
    }
  }
}

function makeClient<C extends AnyRedisClientType>(mgr: MultiDbManager<C>): C {
  const client = new MultiDbClientBase(mgr);
  attachForwarders(client, mgr);
  return client as unknown as C;
}

/* -------------------------------------------------------------------------- */
/* controller — multi-db-only surface (all stubbed)                           */
/* -------------------------------------------------------------------------- */

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

  /** force the active DB (TODO: validate index, emit 'failover') */
  setActiveDatabase(index: number): void {
    this.#mgr.active = this.#mgr.clients[index];
  }

  // TODO: setWeight, addDatabase, removeDatabase, health inspection,
  //       'failover' / 'database-down' events.
}

/* -------------------------------------------------------------------------- */
/* Dedicated factories                                                        */
/* -------------------------------------------------------------------------- */

function assemble<C extends AnyRedisClientType>(clients: Array<C>): MultiDbResult<C> {
  const mgr = new MultiDbManager(clients);
  return { client: makeClient(mgr), controller: new MultiDbController(mgr) };
}

export function createMultiDbClient<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>>;
}): MultiDbResult<RedisClientType<M, F, S, RESP, T>> {
  return assemble(options.databases.map(db => RedisClient.create(db.options)));
}

export function createMultiDbClientPool<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<PoolDatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>>;
}): MultiDbResult<RedisClientPoolType<M, F, S, RESP, T>> {
  return assemble(options.databases.map(db => RedisClientPool.create(db.options, db.poolOptions)));
}

export function createMultiDbCluster<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisClusterOptions<M, F, S, RESP, T>>>;
}): MultiDbResult<RedisClusterType<M, F, S, RESP, T>> {
  return assemble(options.databases.map(db => RedisCluster.create(db.options)));
}

export function createMultiDbSentinel<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisSentinelOptions<M, F, S, RESP, T>>>;
}): MultiDbResult<RedisSentinelType<M, F, S, RESP, T>> {
  return assemble(options.databases.map(db => RedisSentinel.create(db.options)));
}
