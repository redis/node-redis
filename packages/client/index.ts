export {
  /* CommandPolicies, */
  RedisArgument,
  RedisFunctions,
  RedisModules,
  RedisScripts,
  RespVersions,
  TypeMapping,
} from './lib/RESP/types';
export { RESP_TYPES } from './lib/RESP/decoder';
export { VerbatimString } from './lib/RESP/verbatim-string';
export { defineScript } from './lib/lua-script';
export * from './lib/errors';

import RedisClient, { RedisClientOptions, RedisClientType } from './lib/client';
export { RedisClientOptions, RedisClientType };
export const createClient = RedisClient.create;
export { CommandParser } from './lib/client/parser';

import { RedisClientPool, RedisPoolOptions, RedisClientPoolType } from './lib/client/pool';
export { RedisClientPoolType, RedisPoolOptions };
export const createClientPool = RedisClientPool.create;

import RedisCluster, { RedisClusterOptions, RedisClusterType } from './lib/cluster';
export { RedisClusterType, RedisClusterOptions };
export const createCluster = RedisCluster.create;

import RedisSentinel from './lib/sentinel';
export { RedisSentinelOptions, RedisSentinelType } from './lib/sentinel/types';
export const createSentinel = RedisSentinel.create;

export { GEO_REPLY_WITH, GeoReplyWith } from './lib/commands/GEOSEARCH_WITH';


export { SetOptions, CLIENT_KILL_FILTERS, FAILOVER_MODES, CLUSTER_SLOT_STATES, COMMAND_LIST_FILTER_BY, REDIS_FLUSH_MODES } from './lib/commands'

export { BasicClientSideCache, BasicPooledClientSideCache } from './lib/client/cache';
