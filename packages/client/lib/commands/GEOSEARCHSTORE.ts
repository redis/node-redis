import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoSearchFrom, GeoSearchBy, GeoSearchOptions, pushGeoSearchArguments } from './generic-transformers';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEOSEARCH';

interface GeoSearchStoreOptions extends GeoSearchOptions {
    STOREDIST?: true;
}

export function transformArguments(
    destination: RedisCommandArgument,
    source: RedisCommandArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchStoreOptions
): RedisCommandArguments {
    const args = pushGeoSearchArguments(
        ['GEOSEARCHSTORE', destination],
        source,
        from,
        by,
        options
    );

    if (options?.STOREDIST) {
        args.push('STOREDIST');
    }

    return args;
}

export function transformReply(reply: number): number {
    if (typeof reply !== 'number') {
        throw new TypeError(`https://github.com/redis/redis/issues/9261`);
    }

    return reply;
}
