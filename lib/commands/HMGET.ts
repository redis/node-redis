import { transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, fields: string | Array<string>): Array<string> {
    const args = ['HMGET', key];

    if (typeof fields === 'string') {
        args.push(fields);
    } else {
        args.push(...fields);
    }

    return args;
}

export const transformReply = transformReplyStringArray;
