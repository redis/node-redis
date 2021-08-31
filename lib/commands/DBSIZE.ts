import { transformReplyNumber } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(): Array<string> {
    return ['DBSIZE'];
}

export const transformReply = transformReplyNumber;
