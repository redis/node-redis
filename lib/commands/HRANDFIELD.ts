import { transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, count?: number, withValues?: boolean): Array<string> {
    const args = ['HRANDFIELD', key];
    if (count) {
        args.push(count.toString());

        if (withValues) {
            args.push('WITHVALUES');
        }
    }

    return args;
}

export function transformReply(reply: null | string | Array<string>): null | string | Array<string> {
    // TODO: convert to object when `withValues`?
    return reply;
};
