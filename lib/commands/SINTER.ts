import { transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(keys: string | Array<string>): Array<string> {
    const args = ['SINTER'];

    if (typeof keys === 'string') {
        args.push(keys);
    } else {
        args.push(...keys);
    }

    return args; 
}

export const transformReply = transformReplyStringArray;
