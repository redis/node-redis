import { pushVerdictArgument, transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(keys: Array<string> | string): Array<string> {
    return pushVerdictArgument(['ZDIFF'], keys);
}

export const transformReply = transformReplyStringArray;
