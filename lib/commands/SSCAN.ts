import { ScanOptions, transformScanArguments, transformScanReply } from './generic-transformers';

export const IS_READ_ONLY = true;

export function transformArguments(key: string, cursor: number, options?: ScanOptions): Array<string> {
    return [
        'SSCAN',
        key,
        ...transformScanArguments(cursor, options)
    ];
}

export const transformReply = transformScanReply;
