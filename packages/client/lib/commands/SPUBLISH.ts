import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    channel: RedisCommandArgument,
    message: RedisCommandArgument
): RedisCommandArguments {
    return ['SPUBLISH', channel, message];
}

export declare function transformReply(): number;
