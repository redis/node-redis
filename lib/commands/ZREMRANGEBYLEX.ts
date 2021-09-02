import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, min: string, max: string): Array<string> {
    return ['ZREMRANGEBYLEX', key, min, max];
}

export const transformReply = transformReplyNumber;
