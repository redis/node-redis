import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    count: number
): RedisCommandArguments {
    return ['RPOP', key, count.toString()];
}

export declare function transformReply(): Array<RedisCommandArgument> | null;
