interface XRangeRevOptions {
    COUNT?: number;
}

export function transformArguments(key: string, start: string, end: string, options?: XRangeRevOptions): Array<string> {
    const args = ['XREVRANGE', key, start, end];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

export { transformReplyStreamMessages as transformReply } from './generic-transformers';
