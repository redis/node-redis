import { transformReplyString } from './generic-transformers';

export function transformArguments(username: string, rule: string | Array<string>): Array<string> {
    const args = ['ACL', 'SETUSER', username];

    if (typeof rule === 'string') {
        args.push(rule);
    } else {
        args.push(...rule);
    }

    return args;
}

export const transformReply = transformReplyString;
