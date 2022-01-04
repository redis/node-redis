import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    field: RedisCommandArgument
): RedisCommandArguments {
    return ['HGET', key, field];
}

export declare function transformReply(): RedisCommandArgument | undefined;
