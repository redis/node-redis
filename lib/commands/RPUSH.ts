import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, element: string | Array<string>): Array<string> {
    return pushVerdictArguments(['RPUSH', key], element);
}

export const transformReply = transformReplyNumber;
