import { pushSortReadOnlyArgs, SortReadOnlyOptions } from "./generic-transformers";

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, options?: SortReadOnlyOptions): Array<string> {
    const args = ['SORT_RO', key];

    pushSortReadOnlyArgs(args, options);

    return args;
}

export declare function transformReply(): Array<string>;
