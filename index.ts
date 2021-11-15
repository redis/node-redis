import { createClient as _createClient, createCluster as _createCluster } from '@redis/client';
import { RedisScripts } from '@redis/client/dist/lib/commands';
import { RedisClientOptions, RedisClientType } from '@redis/client/dist/lib/client';
import { RedisClusterOptions, RedisClusterType } from '@redis/client/dist/lib/cluster';
import RedisJSON from '@redis/json';
import RediSearch from '@redis/search';

export * from '@redis/client';
export * from '@redis/json';
export * from '@redis/search';

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
