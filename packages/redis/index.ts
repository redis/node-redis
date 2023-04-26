import {
    RedisModules,
    RedisFunctions,
    RedisScripts,
    createClient as _createClient,
    RedisClientOptions,
    RedisClientType as _RedisClientType,
    createCluster as _createCluster,
    RedisClusterOptions,
    RedisClusterType as _RedisClusterType
} from '@redis/client';
import RedisBloomModules from '@redis/bloom';
import RedisGraph from '@redis/graph';
import RedisJSON from '@redis/json';
import RediSearch from '@redis/search';
import RedisTimeSeries from '@redis/time-series';

export * from '@redis/client';
export * from '@redis/bloom';
export * from '@redis/graph';
export * from '@redis/json';
export * from '@redis/search';
export * from '@redis/time-series';

const modules = {
    ...RedisBloomModules,
    graph: RedisGraph,
    json: RedisJSON,
    ft: RediSearch,
    ts: RedisTimeSeries
};

export type RedisDefaultModules = typeof modules;

export type RedisClientType<
    M extends RedisModules = RedisDefaultModules,
    F extends RedisFunctions = Record<string, never>,
    S extends RedisScripts = Record<string, never>
> = _RedisClientType<M, F, S>;

export function createClient<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
>(
    options?: RedisClientOptions<M, F, S>
): _RedisClientType<RedisDefaultModules & M, F, S> {
    return _createClient({
        ...options,
        modules: {
            ...modules,
            ...(options?.modules as M)
        }
    });
}

export type RedisClusterType<
    M extends RedisModules = RedisDefaultModules,
    F extends RedisFunctions = Record<string, never>,
    S extends RedisScripts = Record<string, never>
> = _RedisClusterType<M, F, S>;

export function createCluster<
    M extends RedisModules,
    F extends RedisFunctions,
    S extends RedisScripts
>(
    options: RedisClusterOptions<M, F, S>
): RedisClusterType<RedisDefaultModules & M, F, S> {
    return _createCluster({
        ...options,
        modules: {
            ...modules,
            ...(options?.modules as M)
        }
    });
}
