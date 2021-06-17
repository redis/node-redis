import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, id: string | Array<string>): Array<string> {
    const args = ['XDEL', key];

    if (typeof id === 'string') {
        args.push(id);
    } else {
        args.push(...id);
    }

    return args;
}

export const transformReply = transformReplyNumber;
