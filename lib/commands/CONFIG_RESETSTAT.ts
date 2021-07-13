import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['CONFIG', 'RESETSTAT'];
}

export const transformReply = transformReplyString;
