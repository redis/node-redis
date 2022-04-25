import { RedisCommandArgument, RedisCommandArguments } from '.';
import { SortedSetSide, transformSortedSetMemberReply, transformZMPopArguments, ZMember, ZMPopOptions } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
    keys: RedisCommandArgument | Array<RedisCommandArgument>,
    side: SortedSetSide,
    options?: ZMPopOptions
): RedisCommandArguments {
    return transformZMPopArguments(
        ['ZMPOP'],
        keys,
        side,
        options
    );
}

type ZMPopRawReply = null | [
    key: string,
    elements: Array<[RedisCommandArgument, RedisCommandArgument]>
];

type ZMPopReply = null | {
    key: string,
    elements: Array<ZMember>
};

export function transformReply(reply: ZMPopRawReply): ZMPopReply {
    return reply === null ? null : {
        key: reply[0],
        elements: reply[1].map(transformSortedSetMemberReply)
    };
}
