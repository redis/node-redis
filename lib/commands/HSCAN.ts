import { ScanOptions, pushScanArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, cursor: number, options?: ScanOptions): Array<string> {
    return pushScanArguments([
        'HSCAN',
        key
    ], cursor, options);
}

export interface HScanTuple {
    field: string;
    value: string;
}

interface HScanReply {
    cursor: number;
    tuples: Array<HScanTuple>;
}

export function transformReply([cursor, rawTuples]: [string, Array<string>]): HScanReply {
    const parsedTuples = [];
    for (let i = 0; i < rawTuples.length; i += 2) {
        parsedTuples.push({
            field: rawTuples[i],
            value: rawTuples[i + 1]
        });
    }

    return {
        cursor: Number(cursor),
        tuples: parsedTuples
    };
}
