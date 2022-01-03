import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    field: RedisCommandArgument
): RedisCommandArguments {
    return ['HSTRLEN', key, field];
}

export declare function transformReply(): number;
