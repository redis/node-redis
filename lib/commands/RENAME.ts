import { transformReplyString } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, newKey: string): Array<string> {
    return ['RENAME', key, newKey];
}

export const transformReply = transformReplyString;
