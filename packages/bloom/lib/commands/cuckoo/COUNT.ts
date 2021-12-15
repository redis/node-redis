export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, item: string): Array<string> {
    return ['CF.COUNT', key, item];
}

export declare function transformReply(): number;
