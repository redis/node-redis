import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoCoordinates, GeoUnits, GeoRadiusStoreOptions, pushGeoRadiusStoreArguments } from './generic-transformers';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUS';

export function transformArguments(
    key: RedisCommandArgument,
    coordinates: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    destination: RedisCommandArgument,
    options?: GeoRadiusStoreOptions,
): RedisCommandArguments {
    return pushGeoRadiusStoreArguments(
        ['GEORADIUS'],
        key,
        coordinates,
        radius,
        unit,
        destination,
        options
    );
}

export declare function transformReply(): number;
