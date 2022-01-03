import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ScanOptions, transformNumberInfinityReply, pushScanArguments, ZMember } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    cursor: number,
    options?: ScanOptions
): RedisCommandArguments {
    return pushScanArguments([
        'ZSCAN',
        key
    ], cursor, options);
}

type ZScanRawReply = [RedisCommandArgument, Array<RedisCommandArgument>];

interface ZScanReply {
    cursor: number;
    members: Array<ZMember>;
}

export function transformReply([cursor, rawMembers]: ZScanRawReply): ZScanReply {
    const parsedMembers: Array<ZMember> = [];
    for (let i = 0; i < rawMembers.length; i += 2) {
        parsedMembers.push({
            value: rawMembers[i],
            score: transformNumberInfinityReply(rawMembers[i + 1])
        });
    }

    return {
        cursor: Number(cursor),
        members: parsedMembers
    };
}
