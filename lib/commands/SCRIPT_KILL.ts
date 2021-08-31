import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['SCRIPT', 'KILL'];
}

export const transformReply = transformReplyString;
