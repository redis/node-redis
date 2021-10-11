export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, offset: number, value: string): Array<string> {
    return ['SETRANGE', key, offset.toString(), value];
}

export declare function transformReply(): number;
