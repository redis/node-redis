import { transformReplyNumber } from './generic-transformers.js';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['HLEN', key];
}

export const transformReply = transformReplyNumber;
