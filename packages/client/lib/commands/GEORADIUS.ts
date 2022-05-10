import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoSearchOptions, GeoCoordinates, pushGeoRadiusArguments, GeoUnits } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    coordinates: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    options?: GeoSearchOptions
): RedisCommandArguments {
    return pushGeoRadiusArguments(
        ['GEORADIUS'],
        key,
        coordinates,
        radius,
        unit,
        options
    );
}

export declare function transformReply(): Array<RedisCommandArgument>;
