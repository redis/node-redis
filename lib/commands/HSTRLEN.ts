import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, field: string): Array<string> {
    return ['HSTRLEN', key, field];
}

export const transformReply = transformReplyNumber;
