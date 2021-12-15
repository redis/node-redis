export function transformArguments(key: string, item: string): Array<string> {
    return ['CF.ADDNX', key, item];
}

export declare function transformReply(): boolean;
