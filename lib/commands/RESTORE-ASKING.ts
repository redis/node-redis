import { transformReplyString } from './generic-transformers';

export function transformArguments(): Array<string> {
    return ['RESTORE-ASKING'];
}

export const transformReply = transformReplyString;
