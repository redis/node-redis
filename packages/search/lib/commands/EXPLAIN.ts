import { Params, pushParamsArgs } from ".";

export const IS_READ_ONLY = true;

interface ExplainOptions {
    PARAMS?: Params;
    DIALECT?: number;
}

export function transformArguments(
    index: string,
    query: string,
    options?: ExplainOptions
): Array<string> {
    const args = ['FT.EXPLAIN', index, query];

    pushParamsArgs(args, options?.PARAMS);

    if (options?.DIALECT) {
        args.push('DIALECT', options.DIALECT.toString());
    }

    return args;
}

export declare function transformReply(): string;
