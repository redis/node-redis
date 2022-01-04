import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    seconds: number,
    value: RedisCommandArgument
): RedisCommandArguments {
    return [
        'SETEX',
        key,
        seconds.toString(),
        value
    ];
}

export declare function transformReply(): RedisCommandArgument;
