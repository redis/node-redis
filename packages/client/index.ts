import RedisClient from './lib/client';
import RedisCluster from './lib/cluster';

export { RedisClientType, RedisClientOptions } from './lib/client';

export { RedisModules, RedisFunctions, RedisScripts } from './lib/commands';

export const createClient = RedisClient.create;

export const commandOptions = RedisClient.commandOptions;

export { RedisClusterType, RedisClusterOptions } from './lib/cluster';

export const createCluster = RedisCluster.create;

export { RedisFunctionEngines } from './lib/commands/FUNCTION_LOAD';

export { defineScript } from './lib/lua-script';

export * from './lib/errors';
