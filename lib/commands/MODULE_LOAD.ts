export function transformArguments(path: string, moduleArgs?: Array<string>): Array<string> {
    const args = ['MODULE', 'LOAD', path];

    if (moduleArgs) {
        args.push(...moduleArgs);
    }

    return args;
}

export declare function transformReply(): string;
