export function transformArguments(host: string, port: number): Array<string> {
    return ['REPLICAOF', host, port.toString()];
}

export declare function transformReply(): string;
