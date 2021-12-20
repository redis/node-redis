import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
    key: RedisCommandArgument,
    group: RedisCommandArgument,
    id: RedisCommandArgument
): RedisCommandArguments {
    return ['XGROUP', 'SETID', key, group, id];
}

export declare function transformReply(): RedisCommandArgument;
