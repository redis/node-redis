import { transformReplyStringArray } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['ACL', 'LIST'];
}

export const transformReply = transformReplyStringArray;
