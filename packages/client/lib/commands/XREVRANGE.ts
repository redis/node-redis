interface XRangeRevOptions {
    COUNT?: number;
}

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, start: string, end: string, options?: XRangeRevOptions): Array<string> {
    const args = ['XREVRANGE', key, start, end];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

export { transformReplyStreamStringMessages as transformReply } from './generic-transformers';
