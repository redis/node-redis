import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, members: string | Array<string>): Array<string> {
    const args = ['SREM', key];

    if (typeof members === 'string') {
        args.push(members);
    } else {
        args.push(...members);
    }

    return args;
}

export const transformReply = transformReplyNumber;
