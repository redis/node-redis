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
export type RedisDefaultFunctions = {};
export type RedisDefaultScripts = {};
export type RedisDefaultRESP = 2;
export type RedisDefaultTypeMapping = {};
export type RedisDefaultClientType = RedisClientType<{}, RedisDefaultFunctions, RedisDefaultScripts, RedisDefaultRESP, RedisDefaultTypeMapping>;

export type RedisClientType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = GenericRedisClientType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING>;

export function createClient<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
>(
  options?: RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisClientType<M, F, S, RESP, TYPE_MAPPING> {
  return (genericCreateClient as any)({
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
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
>(clientOptions?: Omit<RedisClientOptions<M, F, S, RESP, TYPE_MAPPING>, "clientSideCache">,
  options?: Partial<RedisPoolOptions>): RedisClientPoolType<M, F, S, RESP, TYPE_MAPPING> {
  return (genericCreateClientPool as any)({
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
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = GenericRedisClientPoolType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING>;

export type RedisClusterType<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = genericRedisClusterType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING>;

export function createCluster<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
>(
  options: RedisClusterOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisClusterType<M, F, S, RESP, TYPE_MAPPING> {
  return (genericCreateCluster as any)({
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
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = genericRedisSentinelType<RedisDefaultModules & M, F, S, RESP, TYPE_MAPPING>;

export function createSentinel<
  M extends RedisModules = {},
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
>(
  options: RedisSentinelOptions<M, F, S, RESP, TYPE_MAPPING>
): RedisSentinelType<M, F, S, RESP, TYPE_MAPPING> {
  return (genericCreateSentinel as any)({
    ...options,
    modules: {
      ...modules,
      ...(options?.modules as M)
    }
  }) as RedisSentinelType<M, F, S, RESP, TYPE_MAPPING>;
}
