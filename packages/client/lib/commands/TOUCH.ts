import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVerdictArguments(['TOUCH'], key);
}

export declare function transformReply(): number;
