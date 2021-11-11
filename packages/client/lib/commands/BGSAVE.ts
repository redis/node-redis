interface BgSaveOptions {
    SCHEDULE?: true;
}

export function transformArguments(options?: BgSaveOptions): Array<string> {
    const args = ['BGSAVE'];

    if (options?.SCHEDULE) {
        args.push('SCHEDULE');
    }

    return args;
}

export declare function transformReply(): string;
