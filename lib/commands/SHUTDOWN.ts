export function transformArguments(mode?: 'NOSAVE' | 'SAVE'): Array<string> {
    const args = ['SHUTDOWN'];

    if (mode) {
        args.push(mode);
    }

    return args;
}

export declare function transformReply(): void;
