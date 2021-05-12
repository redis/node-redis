import { transformReplyString } from './generic-transformers.js';

export function transformArguments(): Array<string> {
    return ['PING'];
}

export const transformReply = transformReplyString;
