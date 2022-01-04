export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['CF.INFO', key];
}

export type InfoRawReply = [
    _: string,
    size: number,
    _: string,
    numberOfBuckets: number,
    _: string,
    numberOfFilters: number,
    _: string,
    numberOfInsertedItems: number,
    _: string,
    numberOfDeletedItems: number,
    _: string,
    bucketSize: number,
    _: string,
    expansionRate: number,
    _: string,
    maxIteration: number
];

export interface InfoReply {
    size: number;
    numberOfBuckets: number;
    numberOfFilters: number;
    numberOfInsertedItems: number;
    numberOfDeletedItems: number;
    bucketSize: number;
    expansionRate: number;
    maxIteration: number;
}

export function transformReply(reply: InfoRawReply): InfoReply {
    return {
        size: reply[1],
        numberOfBuckets: reply[3],
        numberOfFilters: reply[5],
        numberOfInsertedItems: reply[7],
        numberOfDeletedItems: reply[9],
        bucketSize: reply[11],
        expansionRate: reply[13],
        maxIteration: reply[15]
    };
}
