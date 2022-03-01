import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushGeoRadiusArguments, GeoCoordinates, GeoUnits, GeoSearchOptions } from './generic-transformers';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUS';

export function transformArguments(
    key: RedisCommandArgument,
    coor: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    destination: RedisCommandArgument,
    options?: GeoSearchOptions,
    storeDist?: boolean,
): RedisCommandArguments {
    const args = pushGeoRadiusArguments(
        ['GEORADIUS'], key, coor, radius, unit, options
    );

    if (storeDist) {
        args.push('STOREDIST', destination);
    }
    else {
        args.push('STORE', destination);
    }

    return args;
}

export function transformReply(reply: number): number {
    if (typeof reply !== 'number') {
        throw new TypeError(`https://github.com/redis/redis/issues/9261`);
    }

    return reply;
}
