export function transformArguments(key: string, ...items: Array<string>): Array<string> {
    return ['TOPK.COUNT', key, ...items];
}

export declare function transformReply(): Array<number>;
