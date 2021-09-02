import { pushVerdictArguments, transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, keys: string | Array<string>): Array<string> {
    return pushVerdictArguments(['SINTERSTORE', destination], keys);
}

export const transformReply = transformReplyStringArray;
