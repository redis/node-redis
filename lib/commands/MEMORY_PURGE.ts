import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['MEMORY', 'PURGE'];
}

export const transformReply = transformReplyString;
