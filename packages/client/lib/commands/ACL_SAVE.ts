import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['ACL', 'SAVE'];
}

export declare function transformReply(): RedisCommandArgument;
