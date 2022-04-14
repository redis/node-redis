export function transformArguments(mode?: 'HARD' | 'SOFT'): Array<string> {
    const args = ['CLUSTER', 'RESET'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export declare function transformReply(): string;
