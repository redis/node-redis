import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    start: number,
    stop: number
): RedisCommandArguments {
    return [
        'LRANGE',
        key,
        start.toString(),
        stop.toString()
    ];
}

export declare function transformReply(): Array<RedisCommandArgument>;
