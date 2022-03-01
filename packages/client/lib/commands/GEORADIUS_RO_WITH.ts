import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoReplyWith, GeoSearchOptions, GeoCoordinates, GeoUnits } from './generic-transformers';
import { transformArguments as geoRadiusTransformArguments } from './GEORADIUS_RO';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUS_RO';

export function transformArguments(
    key: RedisCommandArgument,
    coor: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
): RedisCommandArguments {
    const args: RedisCommandArguments = geoRadiusTransformArguments(key, coor, radius, unit, options);

    args.push(...replyWith);

    args.preserve = replyWith;

    return args;
}

export { transformGeoMembersWithReply as transformReply } from './generic-transformers';
