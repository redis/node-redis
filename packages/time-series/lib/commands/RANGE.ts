import { RedisCommandArguments } from '@node-redis/client/dist/lib/commands';
import { RangeOptions, Timestamp, pushRangeArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    fromTimestamp: Timestamp,
    toTimestamp: Timestamp,
    options?: RangeOptions
): RedisCommandArguments {
    return pushRangeArguments(
        ['TS.RANGE'],
        fromTimestamp,
        toTimestamp,
        options
    );
}

export { transformRangeReply } from '.';
