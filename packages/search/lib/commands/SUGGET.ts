export const IS_READ_ONLY = true;

export interface SugGetOptions {
    FUZZY?: true;
    MAX?: number;
}

export function transformArguments(key: string, prefix: string, options?: SugGetOptions): Array<string> {
    const args = ['FT.SUGGET', key, prefix];

    if (options?.FUZZY) {
        args.push('FUZZY');
    }

    if (options?.MAX) {
        args.push('MAX', options.MAX.toString());
    }

    return args;
}

export declare function transformReply(): null | Array<string>;
