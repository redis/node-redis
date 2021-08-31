import { ScanOptions, transformReplyNumberInfinity, pushScanArguments, ZMember } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, cursor: number, options?: ScanOptions): Array<string> {
    return pushScanArguments([
        'ZSCAN',
        key
    ], cursor, options);
}

interface ZScanReply {
    cursor: number;
    members: Array<ZMember>;
}

export function transformReply([cursor, rawMembers]: [string, Array<string>]): ZScanReply {
    const parsedMembers: Array<ZMember> = [];
    for (let i = 0; i < rawMembers.length; i += 2) {
        parsedMembers.push({
            value: rawMembers[i],
            score: transformReplyNumberInfinity(rawMembers[i + 1])
        });
    }

    return {
        cursor: Number(cursor),
        members: parsedMembers
    };
}
