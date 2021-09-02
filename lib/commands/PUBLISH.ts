import { transformReplyNumber } from './generic-transformers';

export function transformArguments(channel: string, message: string): Array<string> {
    return ['PUBLISH', channel, message];
}

export const transformReply = transformReplyNumber;
