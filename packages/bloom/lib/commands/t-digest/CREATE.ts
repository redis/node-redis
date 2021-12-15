export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, compression: number): Array<string> {
    return ['TDIGEST.CREATE', key, compression.toString()];
}

export declare function transformReply(): 'OK';
