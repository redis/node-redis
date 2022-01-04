import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(
    username: RedisCommandArgument,
    rule: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVerdictArguments(['ACL', 'SETUSER', username], rule);
}

export declare function transformReply(): RedisCommandArgument;
