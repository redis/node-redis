import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, newKey: string): Array<string> {
    return ['RENAMENX', key, newKey];
}

export const transformReply = transformReplyBoolean;
