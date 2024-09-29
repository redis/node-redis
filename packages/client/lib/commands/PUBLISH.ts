import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(
    channel: RedisCommandArgument,
    message: RedisCommandArgument
): RedisCommandArguments {
    return ['PUBLISH', channel, message];
}

export declare function transformReply(): number;
