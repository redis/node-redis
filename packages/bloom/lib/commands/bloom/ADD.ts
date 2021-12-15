export function transformArguments(key: string, item: string): Array<string> {
    return ['BF.ADD', key, item];
}

export declare function transformReply(): boolean;
