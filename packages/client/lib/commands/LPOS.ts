export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export interface LPosOptions {
    RANK?: number;
    MAXLEN?: number;
}

export function transformArguments(key: string, element: string, options?: LPosOptions): Array<string> {
    const args = ['LPOS', key, element];

    if (typeof options?.RANK === 'number') {
        args.push('RANK', options.RANK.toString());
    }

    if (typeof options?.MAXLEN === 'number') {
        args.push('MAXLEN', options.MAXLEN.toString());
    }

    return args;
}

export declare function transformReply(): number | null;
