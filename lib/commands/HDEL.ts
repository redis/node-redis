import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, field: string | Array<string>): Array<string> {
    const args = ['HDEL', key];

    if (typeof field === 'string') {
        args.push(field);
    } else {
        args.push(...field);
    }

    return args;
}

export const transformReply = transformReplyNumber;
