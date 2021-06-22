import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['CLUSTER', 'FLUSHSLOTS'];
}

export const transformReply = transformReplyString;
