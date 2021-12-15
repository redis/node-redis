export function transformArguments(key: string, item: string): Array<string> {
    return ['CF.ADD', key, item];
}

export declare function transformReply(): boolean;
