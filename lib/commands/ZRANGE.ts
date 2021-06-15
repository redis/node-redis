import { transformArgumentNumberInfinity, transformReplyNumber, transformReplyStringArray } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface ZRangeOptions {
    BY?: 'SCORE' | 'LEX';
    REV?: true;
    LIMIT?: {
        offset: number;
        count: number;
    };
    WITHSCORES?: true;
}

export function transformArguments(src: string, min: number, max: number, options?: ZRangeOptions): Array<string> {
    const args = [
        'ZRANGE',
        src,
        transformArgumentNumberInfinity(min),
        transformArgumentNumberInfinity(max)
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

    if (options?.WITHSCORES) {
        args.push('WITHSCORES');
    }

    return args;
}

// TODO: convert to `ZMember` when "WITHSCORES"
export const transformReply = transformReplyStringArray;
