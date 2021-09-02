export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;


interface SortOptions {
    BY?: string;
    LIMIT?: {
        offset: number;
        count: number;
    },
    GET?: string | Array<string>;
    DIRECTION?: 'ASC' | 'DESC';
    ALPHA?: true;
    STORE?: string;
}

export function transformArguments(key: string, options?: SortOptions): Array<string> {
    const args = ['SORT', key];

    if (options?.BY) {
        args.push('BY', options.BY);
    }

    if (options?.LIMIT) {
        args.push(
            'LIMIT',
            options.LIMIT.offset.toString(), 
            options.LIMIT.count.toString()
        );
    }

    if (options?.GET) {
        for (const pattern of (typeof options.GET === 'string' ? [options.GET] : options.GET)) {
            args.push('GET', pattern);
        }
    }

    if (options?.DIRECTION) {
        args.push(options.DIRECTION);
    }

    if (options?.ALPHA) {
        args.push('ALPHA');
    }

    if (options?.STORE) {
        args.push('STORE', options.STORE);
    }

    return args;
}

// integer when using `STORE`
export function transformReply(reply: Array<string> | number): Array<string> | number {
    return reply;
}
