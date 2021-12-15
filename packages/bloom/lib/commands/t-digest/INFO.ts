export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['TDIGEST.INFO', key];
}

export type InfoRawReply = [
    _: string,
    compression: number,
    _: string,
    capacity: number,
    _: string,
    mergedNodes: number,
    _: string,
    unmergedNodes: number,
    _: string,
    mergedWeight: string,
    _: string,
    unmergedWeight: string,
    _: string,
    totalCompressions: number,
];

export interface InfoReply {
    compression: number;
    capacity: number;
    mergedNodes: number;
    unmergedNodes: number;
    mergedWeight: string;
    unmergedWeight: string;
    totalCompressions: number;
}

export function transformReply(reply: InfoRawReply): InfoReply {
    return {
        compression: reply[1],
        capacity: reply[3],
        mergedNodes: reply[5],
        unmergedNodes: reply[7],
        mergedWeight: reply[9],
        unmergedWeight: reply[11],
        totalCompressions: reply[13]
    };
}
