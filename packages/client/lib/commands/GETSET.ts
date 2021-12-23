import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    value: RedisCommandArgument
): RedisCommandArguments {
    return ['GETSET', key, value];
}

export declare function transformReply(): RedisCommandArgument | null;
