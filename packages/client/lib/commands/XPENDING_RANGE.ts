export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface XPendingRangeOptions {
    IDLE?: number;
    consumer?: string;
}

export function transformArguments(
    key: string,
    group: string,
    start: string,
    end: string,
    count: number,
    options?: XPendingRangeOptions
): Array<string> {
    const args = ['XPENDING', key, group];

    if (options?.IDLE) {
        args.push('IDLE', options.IDLE.toString());
    }

    args.push(start, end, count.toString());

    if (options?.consumer) {
        args.push(options.consumer);
    }

    return args;
}

export { transformReplyStreamMessages as transformReply } from './generic-transformers';
