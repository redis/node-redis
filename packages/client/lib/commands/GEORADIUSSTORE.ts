import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoCoordinates, GeoUnits, GeoRadiusStoreOptions, pushGeoRadiusStoreArguments } from './generic-transformers';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUS';

export function transformArguments(
    key: RedisCommandArgument,
    coor: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    destination: RedisCommandArgument,
    options?: GeoRadiusStoreOptions,
): RedisCommandArguments {
    return pushGeoRadiusStoreArguments(
        ['GEORADIUS'], key, coor, radius, unit, destination, options
    );
}

export function transformReply(reply: number): number {
    if (typeof reply !== 'number') {
        throw new TypeError(`https://github.com/redis/redis/issues/9261`);
    }

    return reply;
}
