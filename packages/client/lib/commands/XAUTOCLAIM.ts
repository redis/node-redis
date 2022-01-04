import { RedisCommandArgument, RedisCommandArguments } from '.';
import { StreamMessagesReply, transformStreamMessagesReply } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export interface XAutoClaimOptions {
    COUNT?: number;
}

export function transformArguments(
    key: RedisCommandArgument,
    group: RedisCommandArgument,
    consumer: RedisCommandArgument,
    minIdleTime: number,
    start: string,
    options?: XAutoClaimOptions
): RedisCommandArguments {
    const args = ['XAUTOCLAIM', key, group, consumer, minIdleTime.toString(), start];

    if (options?.COUNT) {
        args.push('COUNT', options.COUNT.toString());
    }

    return args;
}

type XAutoClaimRawReply = [RedisCommandArgument, Array<any>];

interface XAutoClaimReply {
    nextId: RedisCommandArgument;
    messages: StreamMessagesReply;
}

export function transformReply(reply: XAutoClaimRawReply): XAutoClaimReply {
    return {
        nextId: reply[0],
        messages: transformStreamMessagesReply(reply[1])
    };
}
