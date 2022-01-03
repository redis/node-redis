import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(
    keys: Array<RedisCommandArgument> | RedisCommandArgument
): RedisCommandArguments {
    return pushVerdictArgument(['ZDIFF'], keys);
}

export declare function transformReply(): Array<RedisCommandArgument>;
