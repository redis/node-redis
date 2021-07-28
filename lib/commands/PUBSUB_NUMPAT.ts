import { transformReplyString } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(): Array<string> {
    return ['PUBSUB', 'NUMPAT'];
}

export const transformReply = transformReplyString;
