export const FIRST_KEY_INDEX = 1;

type ReserveOptions = {
    errorRate: number,
    capacity: number,
    expansion?: number,
    nonScaling?: true
}

export function transformArguments(key: string, options: ReserveOptions): Array<string> {
    const args = ['BF.RESERVE', key, options.errorRate.toString(), options.capacity.toString()];
    
    if (options?.expansion) {
        args.push('EXPANSION');
        args.push(options.expansion.toString());
    }

    if (options?.nonScaling) {
        args.push('NONSCALING');
    }

    return args;
}

export declare function transformReply(): 'OK';
