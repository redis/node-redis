import { transformReplyString } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, source: string | Array<string>): Array<string> {
    const args = ['PFMERGE', destination];

    if (typeof source === 'string') {
        args.push(source);
    } else {
        args.push(...source);
    }

    return args;
}

export const transformReply = transformReplyString;
