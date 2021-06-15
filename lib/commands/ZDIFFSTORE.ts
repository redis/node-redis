import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, keys: Array<string> | string): Array<string> {
    const args = ['ZDIFFSTORE', destination];
    
    if (typeof keys === 'string') {
        args.push('1', keys);
    } else {
        args.push(keys.length.toString(), ...keys);
    }

    return args;
}

export const transformReply = transformReplyNumber;
