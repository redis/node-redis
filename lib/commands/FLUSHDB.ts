import { RedisFlushModes } from './FLUSHALL';
import { transformReplyString } from './generic-transformers';

export function transformArguments(mode?: RedisFlushModes): Array<string> {
    const args = ['FLUSHDB'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export const transformReply = transformReplyString;
