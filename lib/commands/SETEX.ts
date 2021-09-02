import { transformReplyString } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, seconds: number, value: string): Array<string> {
    return [
        'SETEX',
        key,
        seconds.toString(),
        value
    ];
}

export const transformReply = transformReplyString;
