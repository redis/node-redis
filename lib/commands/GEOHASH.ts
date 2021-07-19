import { transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, member: string | Array<string>): Array<string> {
    const args = ['GEOHASH', key];

    if (typeof member === 'string') {
        args.push(member);
    } else {
        args.push(...member);
    }

    return args;
}

export const transformReply = transformReplyStringArray;
