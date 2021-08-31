import { transformReplyString } from './generic-transformers';

export function transformArguments(mode: 'YES' | 'SYNC' | 'NO'): Array<string> {
    return ['SCRIPT', 'DEBUG', mode];
}

export const transformReply = transformReplyString;
