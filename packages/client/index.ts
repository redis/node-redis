import RedisClient from './lib/client';
import RedisCluster from './lib/cluster';

export const createClient = RedisClient.create;

export const commandOptions = RedisClient.commandOptions;

export const createCluster = RedisCluster.create;

export { defineScript } from './lib/lua-script';
