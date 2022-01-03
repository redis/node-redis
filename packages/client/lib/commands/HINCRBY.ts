import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    field: RedisCommandArgument,
    increment: number
): RedisCommandArguments {
    return ['HINCRBY', key, field, increment.toString()];
}

export declare function transformReply(): number;
