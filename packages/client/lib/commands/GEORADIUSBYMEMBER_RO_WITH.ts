import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoReplyWith, GeoSearchOptions, GeoUnits } from './generic-transformers';
import { transformArguments as geoRadiusTransformArguments } from './GEORADIUSBYMEMBER_RO';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUSBYMEMBER_RO';

export function transformArguments(
    key: RedisCommandArgument,
    member: string,
    radius: number,
    unit: GeoUnits,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
): RedisCommandArguments {
    const args: RedisCommandArguments = geoRadiusTransformArguments(
        key,
        member,
        radius,
        unit,
        options
    );

    args.push(...replyWith);

    args.preserve = replyWith;

    return args;
}

export { transformGeoMembersWithReply as transformReply } from './generic-transformers';
