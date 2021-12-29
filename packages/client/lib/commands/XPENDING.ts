import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    group: RedisCommandArgument
): RedisCommandArguments {
    return ['XPENDING', key, group];
}

type XPendingRawReply = [
    pending: number,
    firstId: RedisCommandArgument | null,
    lastId: RedisCommandArgument | null,
    consumers: Array<[
        name: RedisCommandArgument,
        deliveriesCounter: RedisCommandArgument
    ]> | null
];

interface XPendingReply {
    pending: number;
    firstId: RedisCommandArgument | null;
    lastId: RedisCommandArgument | null;
    consumers: Array<{
        name: RedisCommandArgument;
        deliveriesCounter: number;
    }> | null;
}

export function transformReply(reply: XPendingRawReply): XPendingReply {
    return {
        pending: reply[0],
        firstId: reply[1],
        lastId: reply[2],
        consumers: reply[3] === null ? null : reply[3].map(([name, deliveriesCounter]) => ({
            name,
            deliveriesCounter: Number(deliveriesCounter)
        }))
    };
}
