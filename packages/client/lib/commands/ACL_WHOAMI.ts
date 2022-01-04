import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['ACL', 'WHOAMI'];
}

export declare function transformReply(): RedisCommandArgument;
