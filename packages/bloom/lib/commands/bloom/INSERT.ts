type InsertOptions = {
    error?: number,
    capacity?: number,
    expansion?: number,
    nonScaling?: true,
    nocreate?: true,
}

export function transformArguments(key: string, options?: InsertOptions, ...items: Array<string>): Array<string> {
    const args = ['BF.INSERT', key];
    
    if (options?.capacity) {
        args.push('CAPACITY');
        args.push(options.capacity.toString());
    }

    if (options?.error) {
        args.push('ERROR');
        args.push(options.error.toString());
    }

    if (options?.expansion) {
        args.push('EXPANSION');
        args.push(options.expansion.toString());
    }

    if (options?.nocreate) {
        args.push('NOCREATE');
    }

    if (options?.nonScaling) {
        args.push('NONSCALING');
    }

    args.push('ITEMS');
    args.push(...items);

    return args;
}

export declare function transformReply(): Array<boolean>;
