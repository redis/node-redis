import { transformArgumentNumberInfinity } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

interface ZRangeStoreOptions {
    BY?: 'SCORE' | 'LEX';
    REV?: true;
    LIMIT?: {
        offset: number;
        count: number;
    };
    WITHSCORES?: true;
}

export function transformArguments(dst: string, src: string, min: number, max: number, options?: ZRangeStoreOptions): Array<string> {
    const args = [
        'ZRANGESTORE',
        dst,
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

// in versions 6.2.0-6.2.4 Redis will return an empty array when `src` is empty
// https://github.com/redis/redis/pull/9089
export function transformReply(reply: number | []): number {
    if (typeof reply === 'number') return reply;

    return 0;
}
