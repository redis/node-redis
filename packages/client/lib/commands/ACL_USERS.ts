import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['ACL', 'USERS'];
}

export declare function transformReply(): Array<RedisCommandArgument>;
