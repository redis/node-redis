export function transformArguments(...slots: string[]): Array<string> {
    const args =  ['CLUSTER', 'DELSLOTS'];
    args.push(...slots);
    return args;
}

export declare function transformReply(): string;
