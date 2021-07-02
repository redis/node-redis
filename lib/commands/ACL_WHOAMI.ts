import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['ACL', 'WHOAMI'];
}

export const transformReply = transformReplyString;
