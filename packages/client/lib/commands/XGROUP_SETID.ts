export const FIRST_KEY_INDEX = 2;

export function transformArguments(key: string, group: string, id: string): Array<string> {
    return ['XGROUP', 'SETID', key, group, id];
}

export declare function transformReply(): string;
