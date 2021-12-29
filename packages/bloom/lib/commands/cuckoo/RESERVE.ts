export const FIRST_KEY_INDEX = 1;

interface ReserveOptions {
    BUCKETSIZE?: number;
    MAXITERATIONS?: number;
    EXPANSION?: number;
}

export function transformArguments(
    key: string,
    capacity: number,
    options?: ReserveOptions
): Array<string> {
    const args = ['CF.RESERVE', key, capacity.toString()];

    if (options?.BUCKETSIZE) {
        args.push('BUCKETSIZE', options.BUCKETSIZE.toString());
    }

    if (options?.MAXITERATIONS) {
        args.push('MAXITERATIONS', options.MAXITERATIONS.toString());
    }

    if (options?.EXPANSION) {
        args.push('EXPANSION', options.EXPANSION.toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
