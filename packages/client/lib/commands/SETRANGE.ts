import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    offset: number,
    value: RedisCommandArgument
): RedisCommandArguments {
    return ['SETRANGE', key, offset.toString(), value];
}

export declare function transformReply(): number;
