import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    increment: number
): RedisCommandArguments {
    return ['INCRBY', key, increment.toString()];
}

export declare function transformReply(): number;
