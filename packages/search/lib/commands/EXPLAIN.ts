import { Params, pushParamsArgs } from ".";

export const IS_READ_ONLY = true;

export function transformArguments(index: string, query: string, params?: Params): Array<string> {
    const args = ['FT.EXPLAIN', index, query];
    pushParamsArgs(args, params);
    return args;
}

export declare function transformReply(): string;
