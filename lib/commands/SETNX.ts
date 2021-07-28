import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, value: string): Array<string> {
    return ['SETNX', key, value];
}

export const transformReply = transformReplyBoolean;
