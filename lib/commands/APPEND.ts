export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, value: string): Array<string> {
    return ['APPEND', key, value];
}

export declare function transformReply(): string;
