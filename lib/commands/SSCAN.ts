import { ScanOptions, transformScanArguments } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(key: string, cursor: number, options?: ScanOptions): Array<string> {
    return [
        'SSCAN',
        key,
        ...transformScanArguments(cursor, options)
    ];
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
