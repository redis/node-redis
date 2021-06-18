import { transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface ZRangeOptions {
    BY?: 'SCORE' | 'LEX';
    REV?: true;
    LIMIT?: {
        offset: number;
        count: number;
    };
}

export function transformArguments(src: string, min: string | number, max: string | number, options?: ZRangeOptions): Array<string> {
    const args = [
        'ZRANGE',
        src,
        typeof min === 'string' ? min : min.toString(),
        typeof max === 'string' ? max : max.toString()
    ];

    switch (options?.BY) {
        case 'SCORE':
            args.push('BYSCORE');
            break;

        case 'LEX':
            args.push('BYLEX');
            break;
    }

    if (options?.REV) {
        args.push('REV');
    }

    if (options?.LIMIT) {
        args.push('LIMIT', options.LIMIT.offset.toString(), options.LIMIT.count.toString());
    }

    return args;
}

export const transformReply = transformReplyStringArray;
