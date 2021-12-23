import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    newKey: RedisCommandArgument
): RedisCommandArguments {
    return ['RENAME', key, newKey];
}

export declare function transformReply(): RedisCommandArgument;
