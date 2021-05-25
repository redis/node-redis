import { transformReplyNumber } from './generic-transformers';

export function transformArguments(keys: string | Array<string>): Array<string> {
    const args = ['DEL'];

    if (typeof keys === 'string') {
        args.push(keys);
    } else {
        args.push(...keys);
    }

    return args;
}

export const transformReply = transformReplyNumber;
