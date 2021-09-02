import { transformReplyString } from './generic-transformers';

interface BgSaveOptions {
    SCHEDULE?: true;
}

export function transformArguments(options?: BgSaveOptions): Array<string> {
    const args = ['BGSAVE'];

    if (options?.SCHEDULE) {
        args.push('SCHEDULE');
    }

    return args;
}

export const transformReply = transformReplyString;