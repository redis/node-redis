import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushGeoRadiusArguments, GeoUnits, GeoSearchOptions } from './generic-transformers';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUSBYMEMBER';

export function transformArguments(
    key: RedisCommandArgument,
    member: string,
    radius: number,
    unit: GeoUnits,
    destination: RedisCommandArgument,
    options?: GeoSearchOptions,
    storeDist?: boolean,
): RedisCommandArguments {
    const args = pushGeoRadiusArguments(
        ['GEORADIUSBYMEMBER'], key, member, radius, unit, options
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
