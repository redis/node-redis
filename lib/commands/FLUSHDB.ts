import { RedisFlushModes } from './FLUSHALL';

export function transformArguments(mode?: RedisFlushModes): Array<string> {
    const args = ['FLUSHDB'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export declare function transformReply(): string;
