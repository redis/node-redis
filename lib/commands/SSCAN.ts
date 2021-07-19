import { ScanOptions, pushScanArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, cursor: number, options?: ScanOptions): Array<string> {
    return pushScanArguments([
        'SSCAN',
        key,
    ], cursor, options);
}

interface SScanReply {
    cursor: number;
    members: Array<string>;
}

export function transformReply([cursor, members]: [string, Array<string>]): SScanReply {
    return {
        cursor: Number(cursor),
        members
    };
}
