import { pushVerdictArguments, transformReplyBooleanArray } from './generic-transformers';

export function transformArguments(sha1: string | Array<string>): Array<string> {
    return pushVerdictArguments(['SCRIPT', 'EXISTS'], sha1);
}

export const transformReply = transformReplyBooleanArray;
