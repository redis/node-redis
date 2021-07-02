import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['ACL', 'SAVE'];
}

export const transformReply = transformReplyString;
