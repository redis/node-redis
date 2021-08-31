import { pushVerdictArguments, transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, member: string | Array<string>): Array<string> {
    return pushVerdictArguments(['ZREM', key], member);
}

export const transformReply = transformReplyNumber;
