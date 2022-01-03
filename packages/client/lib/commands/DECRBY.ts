import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    decrement: number
): RedisCommandArguments {
    return ['DECRBY', key, decrement.toString()];
}

export declare function transformReply(): number;
