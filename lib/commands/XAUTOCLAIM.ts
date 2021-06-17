import { StreamMessagesReply, transformReplyStreamMessages } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export interface XAutoClaimOptions {
    COUNT?: number;
}

export function transformArguments(
    key: string,
    group: string,
    consumer: string,
    minIdleTime: number,
    start: string,
    options?: XAutoClaimOptions
): Array<string> {
    const args = ['XAUTOCLAIM', key, group, consumer, minIdleTime.toString(), start];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

interface XAutoClaimReply {
    nextId: string;
    messages: StreamMessagesReply;
}

export function transformReply(reply: [string, Array<any>]): XAutoClaimReply {
    return {
        nextId: reply[0],
        messages: transformReplyStreamMessages(reply[1])
    };
}
