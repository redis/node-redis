export function transformArguments(script: string): Array<string> {
    return ['SCRIPT', 'LOAD', script];
}

export declare function transformReply(): string;
