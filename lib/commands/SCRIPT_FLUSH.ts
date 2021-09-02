import { transformReplyString } from './generic-transformers';

export function transformArguments(mode?: 'ASYNC' | 'SYNC'): Array<string> {
    const args = ['SCRIPT', 'FLUSH'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export const transformReply = transformReplyString;
