import { transformReplyBoolean } from './generic-transformers';

export function transformArguments(...keys: Array<string>): Array<string> {
    return ['EXISTS', ...keys];
}

export const transformReply = transformReplyBoolean;
