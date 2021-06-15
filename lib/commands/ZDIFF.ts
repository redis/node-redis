import { transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

interface ZDiffOptions {
    WITHSCORES?: true;
}

export function transformArguments(keys: Array<string> | string, options?: ZDiffOptions): Array<string> {
    const args = ['ZDIFF'];
    
    if (typeof keys === 'string') {
        args.push('1', keys);
    } else {
        args.push(keys.length.toString(), ...keys);
    }

    if (options?.WITHSCORES) {
        args.push('WITHSCORES');
    }

    return args;
}

// TODO: convert to `Array<ZMember>` when "WITHSCORES"
export const transformReply = transformReplyStringArray;
