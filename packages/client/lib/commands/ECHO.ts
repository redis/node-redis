import { RedisCommandArgument, RedisCommandArguments } from '.';

export const IS_READ_ONLY = true;

export function transformArguments(message: RedisCommandArgument): RedisCommandArguments {
    return ['ECHO', message];
}

export declare function transformReply(): RedisCommandArgument;
