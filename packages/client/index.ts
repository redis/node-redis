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

import { RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping } from './lib/RESP/types';
import RedisClient, { RedisClientOptions, RedisClientType } from './lib/client';
import RedisClientMultiCommand, { RedisClientMultiCommandType } from './lib/client/multi-command';
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

export { SetOptions } from './lib/commands/SET';

export { REDIS_FLUSH_MODES } from './lib/commands/FLUSHALL';

export { BasicClientSideCache, BasicPooledClientSideCache } from './lib/client/cache';



export const MULTI = < M extends RedisModules, F extends RedisFunctions, S extends RedisScripts, RESP extends RespVersions, TYPE_MAPPING extends TypeMapping >(client: RedisClientType) => {
  type Multi = new (...args: ConstructorParameters<typeof RedisClientMultiCommand>) => RedisClientMultiCommandType<[], M, F, S, RESP, TYPE_MAPPING>;
  return new ((this as any).Multi as Multi)(
    client._executeMulti.bind(client),
    client._executePipeline.bind(client),
    client._commandOptions?.typeMapping
  );
}
