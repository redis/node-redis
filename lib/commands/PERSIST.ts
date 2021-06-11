import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['PERSIST', key];
}

export const transformReply = transformReplyBoolean;
