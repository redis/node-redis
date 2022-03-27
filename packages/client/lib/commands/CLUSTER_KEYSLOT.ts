export function transformArguments(key: string): Array<string> {
    return ['CLUSTER', 'KEYSLOT', key];
}

export declare function transformReply(): number;
