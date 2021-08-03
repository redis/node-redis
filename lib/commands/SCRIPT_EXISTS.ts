import { transformReplyBooleanArray } from './generic-transformers';

export function transformArguments(sha1: string | Array<string>): Array<string> {
    const args = ['SCRIPT', 'EXISTS'];

    if (typeof sha1 === 'string') {
        args.push(sha1);
    } else {
        args.push(...sha1);
    }

    return args;
}

export const transformReply = transformReplyBooleanArray;
