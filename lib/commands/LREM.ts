import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, count: number, element: string): Array<string> {
    return [
        'LREM',
        key,
        count.toString(),
        element
    ];
}

export const transformReply = transformReplyNumber;
