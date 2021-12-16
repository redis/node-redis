import { InsertOptions, pushInsertOptions } from ".";

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: string, options?: 
    InsertOptions, ...items: Array<string>
): Array<string> {
    const args = ['CF.INSERT', key];
    pushInsertOptions(args, items, options);
    return args;
}

export { transformArrayReply as transformReply } from '.';
