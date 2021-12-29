export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string): Array<string> {
    return ['BF.INFO', key];
}

export type InfoRawReply = [
    _: string,
    capacity: number,
    _: string,
    size: number,
    _: string,
    numberOfFilters: number,
    _: string,
    numberOfInsertedItems: number,
    _: string,
    expansionRate: number,
];

export interface InfoReply {
    capacity: number;
    size: number;
    numberOfFilters: number;
    numberOfInsertedItems: number;
    expansionRate: number;
}

export function transformReply(reply: InfoRawReply): InfoReply {
    return {
        capacity: reply[1],
        size: reply[3],
        numberOfFilters: reply[5],
        numberOfInsertedItems: reply[7],
        expansionRate: reply[9]
    };
}
