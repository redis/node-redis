import { RedisCommandArguments } from '@node-redis/client/dist/lib/commands';
import { MRangeOptions, Timestamp, MRangeRawReply, transformMRangeWithLabelsReply, SelectedLabels, MRangeWithLabelsReply, pushMRangeWithLabelsArguments } from '.';

// export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    filters: Array<string>,
    options?: MRangeOptions & SelectedLabels
): RedisCommandArguments {
    return pushMRangeWithLabelsArguments(
        ['TS.MRANGE'],
        fromTimestamp,
        toTimestamp,
        filters,
        options
    );
}

export function transformReply(reply: MRangeRawReply): Array<MRangeWithLabelsReply> {
    return transformMRangeWithLabelsReply(reply);
}