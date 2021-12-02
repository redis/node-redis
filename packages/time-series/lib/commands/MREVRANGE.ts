import { RedisCommandArguments } from '@node-redis/client/dist/lib/commands';
import { MRangeOptions, Timestamp, MRangeReply, pushMRangeArguments, MRangeRawReply, transformMRangeReply } from '.';

// export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    filters: Array<string>,
    options?: MRangeOptions
): RedisCommandArguments {
    return pushMRangeArguments(
        ['TS.MREVRANGE'],
        fromTimestamp,
        toTimestamp,
        filters,
        options
    );
}

export function transformReply(reply: MRangeRawReply): Array<MRangeReply> {
    return transformMRangeReply(reply);
}