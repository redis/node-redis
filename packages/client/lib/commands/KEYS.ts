export function transformArguments(pattern: string): Array<string> {
    return ['KEYS', pattern];
}

export function transformReply(keys: Array<string>): Array<string> {
    return keys;
}