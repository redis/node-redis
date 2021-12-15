import { InsertOptions, pushInsertOptions } from ".";

export function transformArguments(key: string, options?: InsertOptions, ...items: Array<string>): Array<string> {
    const args = ['CF.INSERT', key];
    pushInsertOptions(args, items, options);
    return args;
}

export declare function transformReply(): Array<boolean>;
