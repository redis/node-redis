import {
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RespVersions,
  TypeMapping,
  createClient as genericCreateClient,
  RedisClientOptions,
  RedisClientType as GenericRedisClientType,
  createCluster as genericCreateCluster,
  RedisClusterOptions,
  RedisClusterType as genericRedisClusterType,
  RedisSentinelOptions,
  RedisSentinelType as genericRedisSentinelType,
  createSentinel as genericCreateSentinel,
  createClientPool as genericCreateClientPool,
  RedisClientPoolType as GenericRedisClientPoolType,
  RedisPoolOptions,
  createMultiDbClient as genericCreateMultiDbClient,
  createMultiDbClientPool as genericCreateMultiDbClientPool,
  createMultiDbCluster as genericCreateMultiDbCluster,
  createMultiDbSentinel as genericCreateMultiDbSentinel,
  MultiDbResult,
  MultiDbConfig,
  DatabaseConfig,
  PoolDatabaseConfig,
} from '@redis/client';
import RedisBloomModules from '@redis/bloom';
import RedisJSON from '@redis/json';
import RediSearch from '@redis/search';
import RedisTimeSeries from '@redis/time-series';

export * from '@redis/client';
export * from '@redis/bloom';
export * from '@redis/json';
export * from '@redis/search';
export * from '@redis/time-series';

const modules = {
  ...RedisBloomModules,
  json: RedisJSON,
  ft: RediSearch,
  ts: RedisTimeSeries
};

type RedisStackModules = typeof modules;
export interface RedisDefaultModules extends RedisStackModules {}

export type RedisClientType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
> = GenericRedisClientType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING>;

export function createClient<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
>(
  options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
  return genericCreateClient({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M)
    }
  }) as RedisClientType<M, F, S, RESP, TYPE_MAPPING>;
}

/**
 * Multi-database client with the Redis Stack default modules pre-registered
 * (mirrors {@link createClient}). Returns `{ client, controller }`; `client`
 * is a drop-in {@link RedisClientType}.
 * @experimental
 */
/**
 * Merge the Stack default modules into one member's options. Type-preserving:
 * the merged modules surface only at runtime — the callers' final result cast
 * carries the Stack typing (mirroring `createClient` and friends).
 */
function withStackModules<OPTIONS extends { modules?: unknown } | undefined>(dbOptions: OPTIONS): OPTIONS {
  return {
    ...(dbOptions as object | undefined),
    modules: {
      ...modules,
      ...((dbOptions as { modules?: unknown } | undefined)?.modules as object | undefined)
    }
  } as OPTIONS;
}

/**
 * The manager creates runtime-added members from the config verbatim — they
 * must get the same module merge as the initial members, or the client's
 * json/ft/ts namespaces break after a failover to such a member.
 */
function mergeModulesOnAdd(controller: { addDatabase(config: PoolDatabaseConfig<unknown>): Promise<string> }): void {
  const addDatabase = controller.addDatabase.bind(controller);
  controller.addDatabase = config => addDatabase({
    ...config,
    options: withStackModules(config.options as { modules?: unknown } | undefined)
  });
}

export function createMultiDbClient<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>>>;
} & MultiDbConfig): MultiDbResult<RedisClientType<M, F, S, RESP, TYPE_MAPPING>> {
  const { databases, ...multiDbOptions } = options;
  const result = genericCreateMultiDbClient({
    ...multiDbOptions,
    databases: databases.map(db => ({ ...db, options: withStackModules(db.options) }))
  });
  mergeModulesOnAdd(result.controller);
  return result as unknown as MultiDbResult<RedisClientType<M, F, S, RESP, TYPE_MAPPING>>;
}

/**
 * As {@link createMultiDbClient}, over pooled members — the Stack default
 * modules are pre-registered on every member, initial and runtime-added.
 * @experimental
 */
export function createMultiDbClientPool<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
>(options: {
  databases: Array<PoolDatabaseConfig<RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>>>;
} & MultiDbConfig): MultiDbResult<RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING>> {
  const { databases, ...multiDbOptions } = options;
  const result = genericCreateMultiDbClientPool({
    ...multiDbOptions,
    databases: databases.map(db => ({ ...db, options: withStackModules(db.options) }))
  });
  mergeModulesOnAdd(result.controller);
  return result as unknown as MultiDbResult<RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING>>;
}

/**
 * As {@link createMultiDbClient}, over cluster members — the Stack default
 * modules are pre-registered on every member, initial and runtime-added.
 * @experimental
 */
export function createMultiDbCluster<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>>>;
} & MultiDbConfig): MultiDbResult<RedisClusterType<M, F, S, RESP, TYPE_MAPPING>> {
  const { databases, ...multiDbOptions } = options;
  const result = genericCreateMultiDbCluster({
    ...multiDbOptions,
    databases: databases.map(db => ({ ...db, options: withStackModules(db.options) }))
  });
  mergeModulesOnAdd(result.controller);
  return result as unknown as MultiDbResult<RedisClusterType<M, F, S, RESP, TYPE_MAPPING>>;
}

/**
 * As {@link createMultiDbClient}, over sentinel members — the Stack default
 * modules are pre-registered on every member, initial and runtime-added.
 * @experimental
 */
export function createMultiDbSentinel<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
>(options: {
  databases: Array<DatabaseConfig<RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>>>;
} & MultiDbConfig): MultiDbResult<RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>> {
  const { databases, ...multiDbOptions } = options;
  const result = genericCreateMultiDbSentinel({
    ...multiDbOptions,
    databases: databases.map(db => ({ ...db, options: withStackModules(db.options) }))
  });
  mergeModulesOnAdd(result.controller);
  return result as unknown as MultiDbResult<RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>>;
}

export function createClientPool<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
>(clientOptions?: Omit<RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, "clientSideCache">,
  options?: Partial<RedisPoolOptions>): RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING> {
  return genericCreateClientPool({
    ...clientOptions,
    modules: {
      ...modules,
      ...(clientOptions?.modules as M)
    }
  }, options) as RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING>;
}

export type RedisClientPoolType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
> = GenericRedisClientPoolType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING>;

export type RedisClusterType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
> = genericRedisClusterType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING>;

/**
 * Creates a new Redis Cluster client.
 *
 * Note: `rootNodes` is only used to discover the cluster topology; its configuration is not
 * inherited by the connections made to the discovered nodes. Any setting that should apply to
 * every connection in the cluster (e.g. credentials, TLS) must be specified via `defaults`.
 */
export function createCluster<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
>(
  options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisClusterType<M, F, S, RESP, TYPE_MAPPING> {
  return genericCreateCluster({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M)
    }
  }) as RedisClusterType<M, F, S, RESP, TYPE_MAPPING>;
}

export type RedisSentinelType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
> = genericRedisSentinelType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING>;

export function createSentinel<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 3,
  TYPE_MAPPING extends TypeMapping = {}
>(
  options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisSentinelType<M, F, S, RESP, TYPE_MAPPING> {
  return genericCreateSentinel({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M)
    }
  }) as RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>;
}

