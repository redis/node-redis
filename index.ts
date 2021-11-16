import { createClient as _createClient, createCluster as _createCluster } from '@node-redis/client';
import { RedisScripts } from '@node-redis/client/dist/lib/commands';
import { RedisClientOptions, RedisClientType } from '@node-redis/client/dist/lib/client';
import { RedisClusterOptions, RedisClusterType } from '@node-redis/client/dist/lib/cluster';
import RedisJSON from '@node-redis/json';
import RediSearch from '@node-redis/search';

export * from '@node-redis/client';
export * from '@node-redis/json';
export * from '@node-redis/search';

const modules =  {
    json: RedisJSON,
    ft: RediSearch
};

export function createClient<S extends RedisScripts = Record<string, never>>(
    options?: Omit<RedisClientOptions<never, S>, 'modules'>
): RedisClientType<typeof modules, S> {
    return _createClient({
        ...options,
        modules
    });
}

export function createCluster<S extends RedisScripts = Record<string, never>>(
    options: Omit<RedisClusterOptions<never, S>, 'modules'>
): RedisClusterType<typeof modules, S> {
    return _createCluster({
        ...options,
        modules
    });
}
