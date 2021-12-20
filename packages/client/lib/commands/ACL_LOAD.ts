import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['ACL', 'LOAD'];
}

export declare function transformReply(): RedisCommandArgument;
