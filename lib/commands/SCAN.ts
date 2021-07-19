import { ScanOptions, pushScanArguments } from './generic-transformers';

export const IS_READ_ONLY = true;
export interface ScanCommandOptions extends ScanOptions {
    TYPE?: string;
}

export function transformArguments(cursor: number, options?: ScanCommandOptions): Array<string> {
    const args = pushScanArguments(['SCAN'], cursor, options);

    if (options?.TYPE) {
        args.push('TYPE', options.TYPE);
    }

    return args;
}

export interface ScanReply {
    cursor: number;
    keys: Array<string>;
}

export function transformReply([cursor, keys]: [string, Array<string>]): ScanReply {
    return {
        cursor: Number(cursor),
        keys
    };
}
