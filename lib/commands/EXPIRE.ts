import { transformReplyBoolean } from './generic-transformers.js';

export function transformArguments(key: string, seconds: number): Array<string> {
    return ['EXPIRE', key, seconds.toString()];
}

export const transformReply = transformReplyBoolean;
