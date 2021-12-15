export function transformArguments(key: string, item: string): Array<string> {
    return ['CF.DEL', key, item];
}

export declare function transformReply(): boolean;
