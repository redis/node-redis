import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['BGREWRITEAOF'];
}

export const transformReply = transformReplyString;
