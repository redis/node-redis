import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoUnits, GeoRadiusStoreOptions, pushGeoRadiusStoreArguments } from './generic-transformers';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUSBYMEMBER';

export function transformArguments(
    key: RedisCommandArgument,
    member: string,
    radius: number,
    unit: GeoUnits,
    destination: RedisCommandArgument,
    options?: GeoRadiusStoreOptions,
): RedisCommandArguments {
    return pushGeoRadiusStoreArguments(
        ['GEORADIUSBYMEMBER'], key, member, radius, unit, destination, options
    );
}

export function transformReply(reply: number): number {
    if (typeof reply !== 'number') {
        throw new TypeError(`https://github.com/redis/redis/issues/9261`);
    }

    return reply;
}
