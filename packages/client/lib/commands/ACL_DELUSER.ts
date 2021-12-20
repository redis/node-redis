import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(
    username: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVerdictArguments(['ACL', 'DELUSER'], username);
}

export declare function transformReply(): number;
