import { transformReplyBooleanArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, members: Array<string>): Array<string> {
    return ['SMISMEMBER', key, ...members];
}

export const transformReply = transformReplyBooleanArray;
