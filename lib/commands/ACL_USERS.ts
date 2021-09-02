import { transformReplyStringArray } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['ACL', 'USERS'];
}

export const transformReply = transformReplyStringArray;
