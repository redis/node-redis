export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface XRangeOptions {
    COUNT?: number;
}

export function transformArguments(key: string, start: string, end: string, options?: XRangeOptions): Array<string> {
    const args = ['XRANGE', key, start, end];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

export { transformReplyStreamMessages as transformReply } from './generic-transformers';
