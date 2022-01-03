import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    increment: number
): RedisCommandArguments {
    return ['INCRBYFLOAT', key, increment.toString()];
}

export declare function transformReply(): RedisCommandArgument;
