import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['UNWATCH'];
}

export const transformReply = transformReplyString;
