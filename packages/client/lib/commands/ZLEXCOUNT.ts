import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    min: RedisCommandArgument,
    max: RedisCommandArgument
): RedisCommandArguments {
    return [
        'ZLEXCOUNT',
        key,
        min,
        max
    ];
}

export declare function transformReply(): number;
