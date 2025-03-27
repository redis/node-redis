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
import RedisJSON from '@redis/json';
import RediSearch from '@redis/search';
import RedisTimeSeries from '@redis/time-series';

// export * from '@redis/client';
// export * from '@redis/bloom';
// export * from '@redis/json';
// export * from '@redis/search';
// export * from '@redis/time-series';

const modules = {
  ...RedisBloomModules,
  json: RedisJSON,
  ft: RediSearch,
  ts: RedisTimeSeries
};

/**
 * The default Redis modules available in this package.
 * Includes RedisBloom, RedisJSON, RediSearch, and RedisTimeSeries modules.
 */
export type RedisDefaultModules = typeof modules;

/**
 * Type definition for a Redis client with support for modules, functions, and scripts.
 */
export type RedisClientType<
  M extends RedisModules = RedisDefaultModules,
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = GenericRedisClientType<M, F, S, RESP, TYPE_MAPPING>;

/**
 * Creates a new Redis client.
 * @param options - The options for the Redis client.
 * @returns A new Redis client.
 */
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

/**
 * Creates a new Redis cluster client.
 * @param options - Configuration options for the Redis cluster client
 * @returns A new Redis cluster client instance
 */
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

/**
 * Type definition for a Redis cluster client.
 */
export type RedisClusterType<
  M extends RedisModules = RedisDefaultModules,
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = genericRedisClusterType<M, F, S, RESP, TYPE_MAPPING>;

/**
 * Type definition for a Redis Sentinel client.
 */
export type RedisSentinelType<
  M extends RedisModules = RedisDefaultModules,
  F extends RedisFunctions = {},
  S extends RedisScripts = {},
  RESP extends RespVersions = 2,
  TYPE_MAPPING extends TypeMapping = {}
> = genericRedisSentinelType<M, F, S, RESP, TYPE_MAPPING>;

/**
 * Creates a new Redis Sentinel client.
 * @param options - Configuration options for the Redis Sentinel client
 * @returns A new Redis Sentinel client instance
 */
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
