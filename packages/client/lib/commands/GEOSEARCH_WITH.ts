import { RedisCommandArgument, RedisCommandArguments } from '.';
import { GeoSearchFrom, GeoSearchBy, GeoReplyWith, GeoSearchOptions } from './generic-transformers';
import { transformArguments as geoSearchTransformArguments } from './GEOSEARCH';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEOSEARCH';

export function transformArguments(
    key: RedisCommandArgument,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
): RedisCommandArguments {
    const args: RedisCommandArguments = geoSearchTransformArguments(key, from, by, options);

    args.push(...replyWith);

    args.preserve = replyWith;

    return args;
}

export { transformGeoMembersWithReply as transformReply } from './generic-transformers';
