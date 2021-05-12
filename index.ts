import RedisClient from './lib/client.js';
import RedisCluster from './lib/cluster.js';

export const createClient = RedisClient.create;

export const createCluster = RedisCluster.create;
