import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return [
        'TDIGEST.INFO',
        key
    ];
}

type InfoRawReply = [
    'Compression',
    number,
    'Capacity',
    number,
    'Merged nodes',
    number,
    'Unmerged nodes',
    number,
    'Merged weight',
    string,
    'Unmerged weight',
    string,
    'Total compressions',
    number
];

interface InfoReply {
    comperssion: number;
    capacity: number;
    mergedNodes: number;
    unmergedNodes: number;
    mergedWeight: number;
    unmergedWeight: number;
    totalCompression: number;
}

export function transformReply(reply: InfoRawReply): InfoReply {
    return {
        comperssion: reply[1],
        capacity: reply[3],
        mergedNodes: reply[5],
        unmergedNodes: reply[7],
        mergedWeight: Number(reply[9]),
        unmergedWeight: Number(reply[11]),
        totalCompression: reply[13]
    };
}