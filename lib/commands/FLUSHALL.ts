import { transformReplyString } from './generic-transformers';

export enum RedisFlushModes {
    ASYNC = 'ASYNC',
    SYNC = 'SYNC'
}

export function transformArguments(mode?: RedisFlushModes): Array<string> {
    const args = ['FLUSHALL'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export const transformReply = transformReplyString;
