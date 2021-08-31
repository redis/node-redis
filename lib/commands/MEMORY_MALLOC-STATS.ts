import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['MEMORY', 'MALLOC-STATS'];
}

export const transformReply = transformReplyString;
