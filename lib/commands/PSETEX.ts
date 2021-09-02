import { transformReplyString } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, milliseconds: number, value: string): Array<string> {
    return [
        'PSETEX',
        key,
        milliseconds.toString(),
        value
    ];
}

export const transformReply = transformReplyString;
