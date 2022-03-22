import { pushSortReadOnlyArgs, SortReadOnlyOptions } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

type SortOptions = SortReadOnlyOptions & {
    STORE?: string;
}

export function transformArguments(key: string, options?: SortOptions): Array<string> {
    const args = ['SORT', key];

    pushSortReadOnlyArgs(args, options);

    if (options?.STORE) {
        args.push('STORE', options.STORE);
    }

    return args;
}

// integer when using `STORE`
export function transformReply(reply: Array<string> | number): Array<string> | number {
    return reply;
}
