import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, ...fields: Array<string>): Array<string> {
    return [
        'HDEL',
        key,
        ...fields
    ];
}

export const transformReply = transformReplyNumber;
