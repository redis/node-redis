import { transformReplyString } from './generic-transformers';

export function transformArguments(key: string | Array<string>): Array<string> {
    const args = ['WATCH'];

    if (typeof key === 'string') {
        args.push(key);
    } else {
        args.push(...key);
    }

    return args;
}

export const transformReply = transformReplyString;
