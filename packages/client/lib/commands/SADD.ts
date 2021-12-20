import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    members: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVerdictArguments(['SADD', key], members);
}

export declare function transformReply(): number;
