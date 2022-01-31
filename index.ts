import { createClient as _createClient, createCluster as _createCluster, RedisClientOptions, RedisClientType, RedisClusterOptions, RedisClusterType } from '@node-redis/client';
import { RedisScripts } from '@node-redis/client/dist/lib/commands';
import RedisBloomModules from '@node-redis/bloom';
import RedisGraph from '@node-redis/graph';
import RedisJSON from '@node-redis/json';
import RediSearch from '@node-redis/search';
import RedisTimeSeries from '@node-redis/time-series';

export * from '@node-redis/client';
export * from '@node-redis/bloom';
export * from '@node-redis/graph';
export * from '@node-redis/json';
export * from '@node-redis/search';
export * from '@node-redis/time-series';

const modules =  {
    ...RedisBloomModules,
    graph: RedisGraph,
    json: RedisJSON,
    ft: RediSearch,
    ts: RedisTimeSeries
};

export function createClient<S extends RedisScripts>(
    options?: Omit<RedisClientOptions<never, S>, 'modules'>
): RedisClientType<typeof modules, S> {
    return _createClient({
        ...options,
        modules
    });
}

export function createCluster<S extends RedisScripts>(
    options: Omit<RedisClusterOptions<never, S>, 'modules'>
): RedisClusterType<typeof modules, S> {
    return _createCluster({
        ...options,
        modules
    });
}
