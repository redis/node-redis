import { transformReplyNumber } from './generic-transformers.js';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, decrement: number): Array<string> {
    return ['DECRBY', key, decrement.toString()];
}

export const transformReply = transformReplyNumber;
