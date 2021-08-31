import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string | Array<string>): Array<string> {
    return pushVerdictArguments(['UNLINK'], key);
}

export const transformReply = transformReplyNumber;
