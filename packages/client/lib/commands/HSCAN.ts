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
        'HSCAN',
        key
    ], cursor, options);
}

type HScanRawReply = [RedisCommandArgument, Array<RedisCommandArgument>];

export interface HScanTuple {
    field: RedisCommandArgument;
    value: RedisCommandArgument;
}

interface HScanReply {
    cursor: number;
    tuples: Array<HScanTuple>;
}

export function transformReply([cursor, rawTuples]: HScanRawReply): HScanReply {
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
