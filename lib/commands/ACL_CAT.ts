import { transformReplyStringArray } from './generic-transformers';

export function transformArguments(categoryName?: string): Array<string> {
    const args = ['ACL', 'CAT'];

    if (categoryName) {
        args.push(categoryName);
    }

    return args;
}

export const transformReply = transformReplyStringArray;
