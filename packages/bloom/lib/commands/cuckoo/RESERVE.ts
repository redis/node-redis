export const FIRST_KEY_INDEX = 1;

type ReserveOptions = {
    capacity: number,
    bucketSize?: number,
    maxIterations?: number,
    expansion?: number
}

export function transformArguments(key: string, options: ReserveOptions): Array<string> {
    const args = ['CF.RESERVE', key, options.capacity.toString()];
    
    if (options?.bucketSize) {
        args.push('BUCKETSIZE', options.bucketSize.toString());
    }

    if (options?.maxIterations) {
        args.push('MAXITERATIONS', options.maxIterations.toString());
    }

    if (options?.expansion) {
        args.push('EXPANSION', options.expansion.toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
