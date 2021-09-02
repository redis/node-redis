import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['ACL', 'LOG', 'RESET'];
}

export const transformReply = transformReplyString;
