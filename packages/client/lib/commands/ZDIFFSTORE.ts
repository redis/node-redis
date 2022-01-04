import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    destination: RedisCommandArgument,
    keys: Array<RedisCommandArgument> | RedisCommandArgument
): RedisCommandArguments {
    return pushVerdictArgument(['ZDIFFSTORE', destination], keys);
}

export declare function transformReply(): number;
