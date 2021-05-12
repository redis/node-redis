import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, field: string): Array<string> {
    return ['HEXISTS', key, field];
}

export const transformReply = transformReplyBoolean;
