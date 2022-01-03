export const FIRST_KEY_INDEX = 1;

interface ReserveOptions {
    EXPANSION?: number;
    NONSCALING?: true;
}

export function transformArguments(
    key: string,
    errorRate: number,
    capacity: number,
    options?: ReserveOptions
): Array<string> {
    const args = ['BF.RESERVE', key, errorRate.toString(), capacity.toString()];

    if (options?.EXPANSION) {
        args.push('EXPANSION', options.EXPANSION.toString());
    }

    if (options?.NONSCALING) {
        args.push('NONSCALING');
    }

    return args;
}

export declare function transformReply(): 'OK';
