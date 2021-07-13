import { transformReplyString } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(message: string): Array<string> {
    return ['ECHO', message];
}

export const transformReply = transformReplyString;
