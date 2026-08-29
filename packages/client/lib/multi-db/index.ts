import RedisClient, { RedisClientType, RedisClientOptions } from '../client';
import { RedisClientPool, RedisClientPoolType } from '../client/pool';
import RedisCluster, { RedisClusterType, RedisClusterOptions } from '../cluster';
import RedisSentinel from '../sentinel';
import { RedisSentinelType, RedisSentinelOptions } from '../sentinel/types';
import { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping } from '../RESP/types';
import { MultiDbManager, MemberSpec } from './manager';
import { MultiDbController } from './controller';
import { resolveMultiDbConfig } from './config';
import type { DatabaseConfig, PoolDatabaseConfig, MultiDbConfig, ResolvedMultiDbConfig } from './config';

/**
 * Multi-database client: N homogeneous member databases behind one drop-in
 * client. Each factory returns `{ client, controller }` — the contract lives
 * on {@link createMultiDbClient}; the multi-db-only surface is kept on
 * `controller` so `client` stays exactly the base client type.
 */

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/** Every client shape the multi-db layer can wrap. */
/* eslint-disable @typescript-eslint/no-explicit-any -- any parametrization of each client kind */
export type AnyRedisClientType =
  | RedisClientType<any, any, any, any, any>
  | RedisClientPoolType<any, any, any, any, any>
  | RedisClusterType<any, any, any, any, any>
  | RedisSentinelType<any, any, any, any, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Lifecycle members the multi-db layer intercepts (fan-out) rather than
 * forwarding to one DB. Must list every `MultiDbClientBase` method
 * (`constructor` aside) — forwarders are installed as own properties and
 * would silently shadow an unlisted one.
 */
const INTERCEPTED = new Set<PropertyKey>(['connect', 'close', 'destroy', 'quit']);

export interface MultiDbResult<C extends AnyRedisClientType> {
  /** drop-in: exactly the base client type */
  client: C;
  /** multi-db admin surface */
  controller: MultiDbController<C>;
}

/* -------------------------------------------------------------------------- */
/* client — the drop-in surface (typed exactly as C)                          */
/* -------------------------------------------------------------------------- */

/**
 * Lifecycle base: implements each `INTERCEPTED` member as a real fan-out
 * method. Everything else is patched on by `attachForwarders`.
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
 * each to the ACTIVE DB. Same shape as `commander.ts:attachConfig` — real (own)
 * properties, no runtime trap — but discovered by walking a representative built
 * client's prototype chain instead of a command registry (kind-agnostic; avoids
 * importing each kind's registry + private executor). Runs ONCE at construction;
 * the closures read `mgr.active` at CALL time, so the method SET is fixed
 * (homogeneous DBs) while the TARGET tracks failover —
 * `manager.ts:MultiDbManager.switchTo`'s single-assignment repoint relies on
 * these reads staying uncached.
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
        // command / script method → call active's own method (this = active);
        // settled outcomes must reach `manager.ts:onCommandResult` — the detector feed
        dst[name] = (...args: Array<unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic
          const result = (mgr.active as any)[name](...args);
          if (result instanceof Promise) {
            return result.then(
              (reply: unknown) => {
                mgr.onCommandResult(true);
                return reply;
              },
              (err: unknown) => {
                mgr.onCommandResult(false, err as Error);
                throw err;
              }
            );
          }
          return result;
        };
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
/* Dedicated factories                                                        */
/* -------------------------------------------------------------------------- */

function assemble<C extends AnyRedisClientType>(
  members: Array<MemberSpec<C>>,
  config: ResolvedMultiDbConfig
): MultiDbResult<C> {
  const mgr = new MultiDbManager(members, config);
  return { client: makeClient(mgr), controller: new MultiDbController(mgr) };
}

/**
 * Multi-database failover over standalone `RedisClient` members. Returns
 * `{ client, controller }`: `client` is a drop-in `RedisClientType` — command
 * methods forward to the active member, while `connect`/`close`/`destroy`/
 * `quit` fan out across all members; `controller` is the multi-db admin
 * surface (topology, weights, forced failover, events). Throws `TypeError`
 * synchronously on invalid config: no databases, duplicate ids, weight
 * outside [0, 1], or health-check timeout >= interval.
 * @experimental
 */
export function createMultiDbClient<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>>;
} & MultiDbConfig): MultiDbResult<RedisClientType<M, F, S, RESP, T>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  return assemble(databases.map(db => ({ ...db, client: RedisClient.create(db.options) })), config);
}

/** As {@link createMultiDbClient}, over pooled (`RedisClientPool`) members. @experimental */
export function createMultiDbClientPool<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<PoolDatabaseConfig<RedisClientOptions<M, F, S, RESP, T>>>;
} & MultiDbConfig): MultiDbResult<RedisClientPoolType<M, F, S, RESP, T>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  return assemble(databases.map(db => ({ ...db, client: RedisClientPool.create(db.options, db.poolOptions) })), config);
}

/** As {@link createMultiDbClient}, over `RedisCluster` members. @experimental */
export function createMultiDbCluster<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisClusterOptions<M, F, S, RESP, T>>>;
} & MultiDbConfig): MultiDbResult<RedisClusterType<M, F, S, RESP, T>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  return assemble(databases.map(db => ({ ...db, client: RedisCluster.create(db.options) })), config);
}

/** As {@link createMultiDbClient}, over `RedisSentinel` members. @experimental */
export function createMultiDbSentinel<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  T extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisSentinelOptions<M, F, S, RESP, T>>>;
} & MultiDbConfig): MultiDbResult<RedisSentinelType<M, F, S, RESP, T>> {
  const { databases, config } = resolveMultiDbConfig(options.databases, options);
  return assemble(databases.map(db => ({ ...db, client: RedisSentinel.create(db.options) })), config);
}

/* -------------------------------------------------------------------------- */
/* Public surface re-exports                                                  */
/* -------------------------------------------------------------------------- */

export {
  MultiDbController,
  type DatabaseDescriptor,
  type FailoverReason,
  type FailoverEvent,
  type FallbackEvent,
  type DatabaseUnhealthyEvent,
  type DatabaseRecoveredEvent,
  type AllDatabasesDownEvent,
  type MultiDbControllerEvents
} from './controller';
export { TemporarilyUnavailableError, PermanentlyUnavailableError } from './errors';
export type { DatabaseRole } from './database';
export type {
  MultiDbConfig,
  DatabaseConfig,
  PoolDatabaseConfig,
  HealthCheckConfig,
  FailureDetectorConfig,
  ProbePolicy,
  InitialAvailability
} from './config';
export type { FailureDetector } from './failure-detector';
export type { HealthCheck, HealthCheckTarget } from './health-check';
export type { FailoverStrategy } from './failover-strategy';
export type { CircuitState } from './circuit';
