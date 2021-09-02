import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['PING'];
}

export const transformReply = transformReplyString;
