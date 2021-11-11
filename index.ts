import { createClient as _createClient } from '@redis/client';
import { RedisScripts } from '@redis/client/dist/lib/commands';
import { RedisClientOptions, RedisClientType } from '@redis/client/dist/lib/client';
import RedisJSON from '@redis/json';
import RediSearch from '@redis/search';

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
