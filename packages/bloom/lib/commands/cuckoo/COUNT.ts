export function transformArguments(key: string, item: string): Array<string> {
    return ['CF.COUNT', key, item];
}

export declare function transformReply(): number;
