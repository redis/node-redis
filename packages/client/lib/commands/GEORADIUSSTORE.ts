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

export declare function transformReply(): number 
