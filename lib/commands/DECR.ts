export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['DECR', key];
}

export declare function transformReply(): number;
