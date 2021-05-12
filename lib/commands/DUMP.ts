import { transformReplyString } from './generic-transformers.js';

export function transformArguments(key: string): Array<string> {
    return ['DUMP', key];
}

export const transformReply = transformReplyString;
