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
  createSentinel as genericCreateSentinel
} from '@redis/client';
import RedisBloomModules from '@redis/bloom';
import RedisGraph from '@redis/graph';
import RedisJSON from '@redis/json';
import RediSearch from '@redis/search';
import RedisTimeSeries from '@redis/time-series';

// export * from '@redis/client';
// export * from '@redis/bloom';
// export * from '@redis/graph';
// export * from '@redis/json';
// export * from '@redis/search';
// export * from '@redis/time-series';

const modules = {
  ...RedisBloomModules,
  graph: RedisGraph,
  json: RedisJSON,
  ft: RediSearch,
  ts: RedisTimeSeries
};

export type RedisDefaultModules = typeof modules;

export type RedisClientType<
  M extends RedisModules = RedisDefaultModules,
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = GenericRedisClientType<M, F, S, RESP, TYPE_MAPPING>;

export function createClient<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
>(
  options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>
): GenericRedisClientType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING> {
  return genericCreateClient({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M)
    }
  });
}

export type RedisClusterType<
  M extends RedisModules = RedisDefaultModules,
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = genericRedisClusterType<M, F, S, RESP, TYPE_MAPPING>;

export function createCluster<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
>(
  options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisClusterType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING> {
  return genericCreateCluster({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M)
    }
  });
}

export type RedisSentinelType<
  M extends RedisModules = RedisDefaultModules,
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = genericRedisSentinelType<M, F, S, RESP, TYPE_MAPPING>;

export function createSentinel<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
>(
  options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisSentinelType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING> {
  return genericCreateSentinel({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M)
    }
  });
}
