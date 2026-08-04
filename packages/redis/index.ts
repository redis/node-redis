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

