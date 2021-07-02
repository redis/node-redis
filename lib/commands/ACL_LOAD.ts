import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['ACL', 'LOAD'];
}

export const transformReply = transformReplyString;
