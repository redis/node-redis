import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['BGREWRITEAOF'];
}

export declare function transformReply(): RedisCommandArgument;
