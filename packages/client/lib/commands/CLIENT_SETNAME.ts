import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(name: RedisCommandArgument): RedisCommandArguments {
    return ['CLIENT', 'SETNAME', name];
}

export declare function transformReply(): RedisCommandArgument;
