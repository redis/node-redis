import { RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { MRangeOptions, Timestamp, pushMRangeArguments, Filter } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    filters: Filter,
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

export { transformMRangeReply as transformReply } from '.';
