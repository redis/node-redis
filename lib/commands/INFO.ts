import { transformReplyString } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(section?: string): Array<string> {
    const args = ['INFO'];

    if (section) {
        args.push(section);
    }

    return args;
}

export const transformReply = transformReplyString;
