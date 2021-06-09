import { ScanOptions, transformScanArguments, transformScanReply } from './generic-transformers';

export const IS_READ_ONLY = true;

export interface ScanCommandOptions extends ScanOptions {
    TYPE?: string;
}

export function transformArguments(cursor: number, options?: ScanCommandOptions): Array<string> {
    const args = [
        'SCAN',
        ...transformScanArguments(cursor, options)
    ];
    
    if (options?.TYPE) {
        args.push('TYPE', options.TYPE);
    }
    
    return args;
}

export const transformReply = transformScanReply;
