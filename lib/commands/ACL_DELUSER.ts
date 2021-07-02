import { transformReplyNumber } from './generic-transformers';

export function transformArguments(username: string | Array<string>): Array<string> {
    const args = ['ACL', 'DELUSER'];

    if (typeof username === 'string') {
        args.push(username);
    } else {
        args.push(...username);
    }

    return args;
}

export const transformReply = transformReplyNumber;
