import { pushVerdictArguments, transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, fields: string | Array<string>): Array<string> {
    return pushVerdictArguments(['HMGET', key], fields);
}

export const transformReply = transformReplyStringArray;
