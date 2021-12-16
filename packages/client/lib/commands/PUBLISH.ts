import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(
    channel: RedisCommandArgument,
    message: RedisCommandArgument
): RedisCommandArguments {
    return ['PUBLISH', channel, message];
}

export declare function transformReply(): number;
