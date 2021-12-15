export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, quantile: number): Array<string> {
    return ['TDIGEST.QUANTILE', key, quantile.toString()];
}

export declare function transformReply(): string;
