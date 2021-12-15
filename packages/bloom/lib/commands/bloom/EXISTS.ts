export const IS_READ_ONLY = true;

export function transformArguments(key: string, item: string): Array<string> {
    return ['BF.EXISTS', key, item];
}

export declare function transformReply(): boolean;
