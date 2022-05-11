import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoReplyWith, GeoSearchOptions, GeoCoordinates, GeoUnits } from './generic-transformers';
import { transformArguments as transformGeoRadiusRoArguments } from './GEORADIUS_RO';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUS_RO';

export function transformArguments(
    key: RedisCommandArgument,
    coordinates: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
): RedisCommandArguments {
    const args: RedisCommandArguments = transformGeoRadiusRoArguments(
        key,
        coordinates,
        radius,
        unit,
        options
    );

    args.push(...replyWith);

    args.preserve = replyWith;

    return args;
}

export { transformGeoMembersWithReply as transformReply } from './generic-transformers';
