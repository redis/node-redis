import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    group: RedisCommandArgument,
    id: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVerdictArguments(['XACK', key, group], id);
}

export declare function transformReply(): number;
