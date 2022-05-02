import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { RangeOptions, Timestamp, pushRangeArguments, SampleRawReply, SampleReply, transformRangeReply } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: string,
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    options?: RangeOptions
): RedisCommandArguments {
    return pushRangeArguments(
        ['TS.REVRANGE', key],
        fromTimestamp,
        toTimestamp,
        options
    );
}

export function transformReply(reply: Array<SampleRawReply>): Array<SampleReply> {
    return transformRangeReply(reply);
}
