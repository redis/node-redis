import { transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(keys: Array<string> | string): Array<string> {
    const args = ['ZDIFF'];
    
    if (typeof keys === 'string') {
        args.push('1', keys);
    } else {
        args.push(keys.length.toString(), ...keys);
    }

    return args;
}

export const transformReply = transformReplyStringArray;
