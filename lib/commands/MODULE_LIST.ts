import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['MODULE', 'LIST'];
}

export const transformReply = transformReplyString;
