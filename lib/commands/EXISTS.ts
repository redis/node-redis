import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(keys: string | Array<string>): Array<string> {
    const args = ['EXISTS'];

    if (typeof keys === 'string') {
        args.push(keys);
    } else {
        args.push(...keys);
    }

    return args;
}

export const transformReply = transformReplyBoolean;
