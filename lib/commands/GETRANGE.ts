export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, start: number, end: number): Array<string> {
    return ['GETRANGE', key, start.toString(), end.toString()];
}

export declare function transformReply(): string;
