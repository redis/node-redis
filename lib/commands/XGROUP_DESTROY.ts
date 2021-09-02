import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export function transformArguments(key: string, group: string): Array<string> {
    return ['XGROUP', 'DESTROY', key, group];
}

export const transformReply = transformReplyBoolean;
