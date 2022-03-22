import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformSortedSetMemberReply, transformZMPopArguments, ZMember, ZMPopOptions } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

export function transformArguments(
    keys: string | Array<string>,
    options: ZMPopOptions
): RedisCommandArguments {
    return transformZMPopArguments(['ZMPOP'], keys, options);
}

type ZMPopRawReply = null | [string, Array<[RedisCommandArgument, RedisCommandArgument]>];

type ZMPopReply = null | [
    key: string, 
    elements: Array<ZMember>
];

export function transformReply(reply: ZMPopRawReply): ZMPopReply {
    if (reply == null) return null;

    return [reply[0], reply[1].map(transformSortedSetMemberReply)];
}
