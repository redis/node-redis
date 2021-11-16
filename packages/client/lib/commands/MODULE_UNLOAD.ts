export function transformArguments(name: string): Array<string> {
    return ['MODULE', 'UNLOAD', name];
}

export declare function transformReply(): string;
