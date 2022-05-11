import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoReplyWith, GeoSearchOptions, GeoUnits } from './generic-transformers';
import { transformArguments as transformGeoRadiusArguments } from './GEORADIUSBYMEMBER';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEORADIUSBYMEMBER';

export function transformArguments(
    key: RedisCommandArgument,
    member: string,
    radius: number,
    unit: GeoUnits,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
): RedisCommandArguments {
    const args: RedisCommandArguments = transformGeoRadiusArguments(
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
