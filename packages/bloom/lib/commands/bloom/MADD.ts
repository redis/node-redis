export function transformArguments(key: string, ...items: Array<string>): Array<string> {
    return ['BF.MADD', key, ...items];
}

export declare function transformReply(): Array<boolean>;
