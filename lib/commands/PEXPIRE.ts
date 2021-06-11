import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, milliseconds: number): Array<string> {
    return ['PEXPIRE', key, milliseconds.toString()];
}

export const transformReply = transformReplyBoolean;
