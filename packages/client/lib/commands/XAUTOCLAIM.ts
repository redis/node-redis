import { RedisCommandArgument, RedisCommandArguments } from '.';
import { StreamMessagesNullReply, transformStreamMessagesNullReply } from './generic-transformers';

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
    messages: StreamMessagesNullReply;
}

export function transformReply(reply: XAutoClaimRawReply): XAutoClaimReply {
    return {
        nextId: reply[0],
        messages: transformStreamMessagesNullReply(reply[1])
    };
}
