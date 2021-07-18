import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, member: string): Array<string> {
    return ['SISMEMBER', key, member];
}

export const transformReply = transformReplyBoolean;