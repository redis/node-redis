export const FIRST_KEY_INDEX = 1;

type InsertOptions = {
    error?: number,
    capacity?: number,
    expansion?: number,
    nonScaling?: true,
    noCreate?: true,
}

export function transformArguments(key: string, options?: InsertOptions, ...items: Array<string>): Array<string> {
    const args = ['BF.INSERT', key];
    
    if (options?.capacity) {
        args.push('CAPACITY', options.capacity.toString());
    }

    if (options?.error) {
        args.push('ERROR', options.error.toString());
    }

    if (options?.expansion) {
        args.push('EXPANSION', options.expansion.toString());
    }

    if (options?.noCreate) {
        args.push('NOCREATE');
    }

    if (options?.nonScaling) {
        args.push('NONSCALING');
    }

    args.push('ITEMS', ...items);

    return args;
}

export { transformArrayReply as transformReply } from '.';
