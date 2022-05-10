import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoSearchOptions, pushGeoRadiusArguments, GeoUnits } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    member: string,
    radius: number,
    unit: GeoUnits,
    options?: GeoSearchOptions
): RedisCommandArguments {
    return pushGeoRadiusArguments(
        ['GEORADIUSBYMEMBER'],
        key,
        member,
        radius,
        unit,
        options
    );
}

export declare function transformReply(): Array<RedisCommandArgument>;
