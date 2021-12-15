export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, value: number): Array<string> {
    return ['TDIGEST.CDF', key, value.toString()];
}

export declare function transformReply(): string;
