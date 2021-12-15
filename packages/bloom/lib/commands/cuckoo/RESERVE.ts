type ReserveOptions = {
    capacity: number,
    bucketSize?: number,
    maxIterations?: number,
    expansion?: number
}

export function transformArguments(key: string, options: ReserveOptions): Array<string> {
    const args = ['CF.RESERVE', key, options.capacity.toString()];
    
    if (options?.bucketSize) {
        args.push('BUCKETSIZE');
        args.push(options.bucketSize.toString());
    }

    if (options?.maxIterations) {
        args.push('MAXITERATIONS');
        args.push(options.maxIterations.toString());
    }

    if (options?.expansion) {
        args.push('EXPANSION');
        args.push(options.expansion.toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
