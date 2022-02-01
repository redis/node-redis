import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface XPendingRangeOptions {
    IDLE?: number;
    consumer?: RedisCommandArgument;
}

export function transformArguments(
    key: RedisCommandArgument,
    group: RedisCommandArgument,
    start: string,
    end: string,
    count: number,
    options?: XPendingRangeOptions
): RedisCommandArguments {
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

type XPendingRangeRawReply = Array<[
    id: RedisCommandArgument,
    consumer: RedisCommandArgument,
    millisecondsSinceLastDelivery: number,
    deliveriesCounter: number
]>;

type XPendingRangeReply = Array<{
    id: RedisCommandArgument;
    owner: RedisCommandArgument;
    millisecondsSinceLastDelivery: number;
    deliveriesCounter: number;
}>;

export function transformReply(reply: XPendingRangeRawReply): XPendingRangeReply {
    return reply.map(([id, owner, millisecondsSinceLastDelivery, deliveriesCounter]) => ({
        id,
        owner,
        millisecondsSinceLastDelivery,
        deliveriesCounter
    }));
}
