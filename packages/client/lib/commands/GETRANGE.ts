import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    start: number,
    end: number
): RedisCommandArguments {
    return ['GETRANGE', key, start.toString(), end.toString()];
}

export declare function transformReply(): RedisCommandArgument;
