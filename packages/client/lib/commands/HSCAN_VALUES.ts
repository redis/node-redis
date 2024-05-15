import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ScanOptions, pushScanArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    cursor: number,
    options?: ScanOptions
): RedisCommandArguments {
    const args = pushScanArguments([
        'HSCAN',
        key
    ], cursor, options);
    args.push('VALUES');

    return args;
}

type HScanRawReply = [RedisCommandArgument, Array<RedisCommandArgument>];

export interface HScanTuple {
    field: RedisCommandArgument;
    value: RedisCommandArgument;
}

interface HScanValueReply {
    cursor: number;
    fields: Array<RedisCommandArgument>;
}

export function transformReply([cursor, fields]: HScanRawReply): HScanValueReply {
    return {
        cursor: Number(cursor),
        fields: fields
    };
}
