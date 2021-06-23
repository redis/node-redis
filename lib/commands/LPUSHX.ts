import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, element: string | Array<string>): Array<string> {
    const args = [
        'LPUSHX',
        key
    ];

    if (typeof element === 'string') {
        args.push(element);
    } else {
        args.push(...element);
    }

    return args;
}

export const transformReply = transformReplyNumber;
