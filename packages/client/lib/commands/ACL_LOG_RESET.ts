import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['ACL', 'LOG', 'RESET'];
}

export declare function transformReply(): RedisCommandArgument;
