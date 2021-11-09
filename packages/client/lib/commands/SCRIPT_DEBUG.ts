export function transformArguments(mode: 'YES' | 'SYNC' | 'NO'): Array<string> {
    return ['SCRIPT', 'DEBUG', mode];
}

export declare function transformReply(): string;
