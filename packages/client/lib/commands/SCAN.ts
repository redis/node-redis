import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ScanOptions, pushScanArguments } from './generic-transformers';

export const IS_READ_ONLY = true;
export interface ScanCommandOptions extends ScanOptions {
    TYPE?: RedisCommandArgument;
}

export function transformArguments(
    cursor: number,
    options?: ScanCommandOptions
): RedisCommandArguments {
    const args = pushScanArguments(['SCAN'], cursor, options);

    if (options?.TYPE) {
        args.push('TYPE', options.TYPE);
    }

    return args;
}

type ScanRawReply = [string, Array<string>];

export interface ScanReply {
    cursor: number;
    keys: Array<RedisCommandArgument>;
}

export function transformReply([cursor, keys]: ScanRawReply): ScanReply {
    return {
        cursor: Number(cursor),
        keys
    };
}
