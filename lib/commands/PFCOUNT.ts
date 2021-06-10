import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string | Array<string>): Array<string> {
    const args = ['PFCOUNT'];

    if (typeof key === 'string') {
        args.push(key);
    } else {
        args.push(...key);
    }

    return args;
}

export const transformReply = transformReplyNumber;
