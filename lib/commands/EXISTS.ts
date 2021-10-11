import { RedisCommandArguments } from '.';
import { pushVerdictArguments, transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(keys: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['EXISTS'], keys);
}

export const transformReply = transformReplyBoolean;
