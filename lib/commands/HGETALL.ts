import { transformReplyTuples } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['HGETALL', key];
}

export const transformReply = transformReplyTuples;
