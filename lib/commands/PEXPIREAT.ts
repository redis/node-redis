import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, millisecondsTimestamp: number): Array<string> {
    return ['PEXPIREAT', key, millisecondsTimestamp.toString()];
}

export const transformReply = transformReplyBoolean;
