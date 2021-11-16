interface SugAddOptions {
    INCR?: true;
    PAYLOAD?: string;
}

export function transformArguments(key: string, string: string, score: number, options?: SugAddOptions): Array<string> {
    const args = ['FT.SUGADD', key, string, score.toString()];

    if (options?.INCR) {
        args.push('INCR');
    }

    if (options?.PAYLOAD) {
        args.push('PAYLOAD', options.PAYLOAD);
    }

    return args;
}

export declare function transformReply(): number;
