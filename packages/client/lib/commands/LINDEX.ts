import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    index: number
): RedisCommandArguments {
    return ['LINDEX', key, index.toString()];
}

export declare function transformReply(): RedisCommandArgument | null;
