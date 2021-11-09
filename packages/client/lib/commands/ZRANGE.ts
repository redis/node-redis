import { transformArgumentNumberInfinity } from './generic-transformers';

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

export function transformArguments(key: string, min: string | number, max: string | number, options?: ZRangeOptions): Array<string> {
    const args = [
        'ZRANGE',
        key,
        typeof min === 'string' ? min : transformArgumentNumberInfinity(min),
        typeof max === 'string' ? max : transformArgumentNumberInfinity(max)
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

export declare function transformReply(): Array<string>;
