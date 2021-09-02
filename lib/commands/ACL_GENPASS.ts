import { transformReplyString } from './generic-transformers';

export function transformArguments(bits?: number): Array<string> {
    const args = ['ACL', 'GENPASS'];

    if (bits) {
        args.push(bits.toString());
    }

    return args;
}

export const transformReply = transformReplyString;
