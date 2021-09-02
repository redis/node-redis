import { transformReplyNumberInfinityNull } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, member: string): Array<string> {
    return ['ZSCORE', key, member];
}

export const transformReply = transformReplyNumberInfinityNull;
