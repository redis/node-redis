import { transformReplyBoolean } from './generic-transformers.js';

export function transformArguments(...keys: Array<string>): Array<string> {
    return ['EXISTS', ...keys];
}

export const transformReply = transformReplyBoolean;
