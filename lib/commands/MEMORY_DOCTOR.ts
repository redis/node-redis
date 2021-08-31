import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['MEMORY', 'DOCTOR'];
}

export const transformReply = transformReplyString;
