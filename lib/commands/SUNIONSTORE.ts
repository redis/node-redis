import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(destination: string, keys: string | Array<string>): Array<string> {
    const args = ['SUNIONSTORE', destination];
    
    if (typeof keys === 'string') {
        args.push(keys);        
    } else {
        args.push(...keys);
    }

    return args;
}

export const transformReply = transformReplyNumber;
