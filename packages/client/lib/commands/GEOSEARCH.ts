import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoSearchFrom, GeoSearchBy, GeoSearchOptions, pushGeoSearchArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    options?: GeoSearchOptions
): RedisCommandArguments {
    return pushGeoSearchArguments(['GEOSEARCH'], key, from, by, options);
}

export declare function transformReply(): Array<RedisCommandArgument>;
