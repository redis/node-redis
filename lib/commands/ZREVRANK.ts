export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, member: string): Array<string> {
    return ['ZREVRANK', key, member];
}

export declare function transformReply(): number | null;
