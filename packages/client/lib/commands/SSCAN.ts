import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ScanOptions, pushScanArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    cursor: number,
    options?: ScanOptions
): RedisCommandArguments {
    return pushScanArguments([
        'SSCAN',
        key,
    ], cursor, options);
}

type SScanRawReply = [string, Array<RedisCommandArgument>];

interface SScanReply {
    cursor: number;
    members: Array<RedisCommandArgument>;
}

export function transformReply([cursor, members]: SScanRawReply): SScanReply {
    return {
        cursor: Number(cursor),
        members
    };
}
