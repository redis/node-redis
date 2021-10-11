export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, count: number): Array<string> {
    return ['RPOP', key, count.toString()];
}

export declare function transformReply(): Array<string> | null;
