import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 0;

export function transformArguments(key: string, elements: string | Array<string>): Array<string> {
    const args = [
        'LPUSH',
        key
    ];

    if (typeof elements === 'string') {
        args.push(elements);
    } else {
        args.push(...elements);
    }

    return args;
}

export const transformReply = transformReplyNumber;
