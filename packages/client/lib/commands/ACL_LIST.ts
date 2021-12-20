import { RedisCommandArgument, RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['ACL', 'LIST'];
}

export declare function transformReply(): Array<RedisCommandArgument>;
