import { TransformArgumentsReply } from '.';
import { GeoSearchFrom, GeoSearchBy, GeoReplyWith, GeoSearchOptions, transformGeoMembersWithReply } from './generic-transformers';
import { transformArguments as geoSearchTransformArguments } from './GEOSEARCH';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './GEOSEARCH';

export function transformArguments(
    key: string,
    from: GeoSearchFrom,
    by: GeoSearchBy,
    replyWith: Array<GeoReplyWith>,
    options?: GeoSearchOptions
): TransformArgumentsReply {
    const args: TransformArgumentsReply = geoSearchTransformArguments(key, from, by, options);

    args.push(...replyWith);

    args.preserve = replyWith;

    return args;
}

export const transformReply = transformGeoMembersWithReply;
