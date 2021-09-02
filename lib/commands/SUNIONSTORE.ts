import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, keys: string | Array<string>): Array<string> {
    return pushVerdictArguments(['SUNIONSTORE', destination], keys);
}

export const transformReply = transformReplyNumber;
