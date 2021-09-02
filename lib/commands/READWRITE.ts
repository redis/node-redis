import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['READWRITE'];
}

export const transformReply = transformReplyString;
