import { pushVerdictArguments, transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(keys: string | Array<string>): Array<string> {
    return pushVerdictArguments(['SUNION'], keys);
}

export const transformReply = transformReplyStringArray;
