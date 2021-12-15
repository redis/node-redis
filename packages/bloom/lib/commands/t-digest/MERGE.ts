export const FIRST_KEY_INDEX = 1;

export function transformArguments(toKey: string, fromKey: string): Array<string> {
    return ['TDIGEST.MERGE', toKey, fromKey];
}

export declare function transformReply(): 'OK';
