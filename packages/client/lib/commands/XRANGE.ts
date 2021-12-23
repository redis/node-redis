import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface XRangeOptions {
    COUNT?: number;
}

export function transformArguments(
    key: RedisCommandArgument,
    start: RedisCommandArgument,
    end: RedisCommandArgument,
    options?: XRangeOptions
): RedisCommandArguments {
    const args = ['XRANGE', key, start, end];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

export { transformStreamMessagesReply as transformReply } from './generic-transformers';
