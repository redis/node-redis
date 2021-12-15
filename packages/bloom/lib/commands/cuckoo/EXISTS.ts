export const IS_READ_ONLY = true;

export function transformArguments(key: string, item: string): Array<string> {
    return ['CF.EXISTS', key, item];
}

export declare function transformReply(): boolean;
