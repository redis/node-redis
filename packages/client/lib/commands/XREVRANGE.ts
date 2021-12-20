import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface XRangeRevOptions {
    COUNT?: number;
}

export function transformArguments(
    key: RedisCommandArgument,
    start: RedisCommandArgument,
    end: RedisCommandArgument,
    options?: XRangeRevOptions
): RedisCommandArguments {
    const args = ['XREVRANGE', key, start, end];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

export { transformStreamMessagesReply as transformReply } from './generic-transformers';
