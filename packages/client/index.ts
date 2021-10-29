import RedisClient from './lib/client';
import RedisCluster from './lib/cluster';

export { RedisClientType, RedisClientOptions } from './lib/client';

export const createClient = RedisClient.create;

export const commandOptions = RedisClient.commandOptions;

export { RedisClusterType, RedisClusterOptions } from './lib/cluster';

export const createCluster = RedisCluster.create;

export { defineScript } from './lib/lua-script';
