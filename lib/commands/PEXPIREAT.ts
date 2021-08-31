import { transformPXAT, transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, millisecondsTimestamp: number | Date): Array<string> {
    return [
        'PEXPIREAT',
        key,
        transformPXAT(millisecondsTimestamp)
    ];
}

export const transformReply = transformReplyBoolean;
