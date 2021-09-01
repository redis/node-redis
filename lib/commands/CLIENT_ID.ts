import { transformReplyNumber } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(): Array<string> {
    return ['CLIENT', 'ID'];
}

export const transformReply = transformReplyNumber;
