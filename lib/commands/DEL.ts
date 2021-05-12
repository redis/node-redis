import { transformReplyNumber } from './generic-transformers.js';

export function transformArguments(...keys: Array<string>): Array<string> {
    return ['DEL', ...keys];
}

export const transformReply = transformReplyNumber;
