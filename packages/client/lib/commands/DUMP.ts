import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return ['DUMP', key];
}

export declare function transformReply(): RedisCommandArgument;
