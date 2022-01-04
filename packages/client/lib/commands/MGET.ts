import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    keys: Array<RedisCommandArgument>
): RedisCommandArguments {
    return ['MGET', ...keys];
}

export declare function transformReply(): Array<RedisCommandArgument | null>;
