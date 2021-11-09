export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['GETDEL', key];
}

export declare function transformReply(): string | null;
