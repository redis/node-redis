import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, member: string | Array<string>): Array<string> {
    const args = ['ZREM', key];

    if (typeof member === 'string') {
        args.push(member);
    } else {
        args.push(...member);
    }

    return args;
}

export const transformReply = transformReplyNumber;
