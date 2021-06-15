import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, min: number, max: number): Array<string> {
    return ['ZREMRANGEBYSCORE', key, min.toString(), max.toString()];
}

export const transformReply = transformReplyNumber;
