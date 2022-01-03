import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return ['XINFO', 'GROUPS', key];
}

type XInfoGroupsReply = Array<{
    name: RedisCommandArgument;
    consumers: number;
    pending: number;
    lastDeliveredId: RedisCommandArgument;
}>;

export function transformReply(rawReply: Array<any>): XInfoGroupsReply {
    return rawReply.map(group => ({
        name: group[1],
        consumers: group[3],
        pending: group[5],
        lastDeliveredId: group[7]
    }));
}
