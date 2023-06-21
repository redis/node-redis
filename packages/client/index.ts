export { RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping, CommandPolicies } from './lib/RESP/types';
export { RESP_TYPES } from './lib/RESP/decoder';
export { VerbatimString } from './lib/RESP/verbatim-string';
export { defineScript } from './lib/lua-script';
// export * from './lib/errors';

import RedisClient, { RedisClientType, RedisClientOptions } from './lib/client';
export { RedisClientType, RedisClientOptions };
export const createClient = RedisClient.create;

import RedisCluster, { RedisClusterType, RedisClusterOptions } from './lib/cluster';
export { RedisClusterType, RedisClusterOptions };
export const createCluster = RedisCluster.create;

// export { GeoReplyWith } from './lib/commands/generic-transformers';

// export { SetOptions } from './lib/commands/SET';

// export { RedisFlushModes } from './lib/commands/FLUSHALL';
