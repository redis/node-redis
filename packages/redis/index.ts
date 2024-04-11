import {
  RedisModules,
  RedisFunctions,
  RedisScripts,
  RespVersions,
  TypeMapping,
  createClient as _createClient,
  RedisClientOptions,
  RedisClientType as _RedisClientType,
  createCluster as _createCluster,
  RedisClusterOptions,
  RedisClusterType as _RedisClusterType,
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
> = _RedisClientType<M, F, S, RESP, TYPE_MAPPING>;

export function createClient<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
>(
  options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>
): _RedisClientType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING> {
  return _createClient({
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
> = _RedisClusterType<M, F, S, RESP, TYPE_MAPPING>;

export function createCluster<
  M extends RedisModules,
  F extends RedisFunctions,
  S extends RedisScripts,
  RESP extends RespVersions,
  TYPE_MAPPING extends TypeMapping
>(
  options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisClusterType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING> {
  return _createCluster({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M)
    }
  });
}
