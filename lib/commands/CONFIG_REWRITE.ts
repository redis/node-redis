import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['CONFIG', 'REWRITE'];
}

export const transformReply = transformReplyString;
