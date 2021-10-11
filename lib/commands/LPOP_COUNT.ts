export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, count: number): Array<string> {
    return ['LPOP', key, count.toString()];
}

export declare function transformReply(): Array<string> | null;
