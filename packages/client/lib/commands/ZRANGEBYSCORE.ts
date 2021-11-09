import { RedisCommandArguments } from '.';
import { transformArgumentNumberInfinity } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export interface ZRangeByScoreOptions {
    LIMIT?: {
        offset: number;
        count: number;
    };
}

export function transformArguments(
    key: string,
    min: number | string,
    max: number | string,
    options?: ZRangeByScoreOptions
): RedisCommandArguments {
    const args = [
        'ZRANGEBYSCORE',
        key,
        typeof min === 'string' ? min : transformArgumentNumberInfinity(min),
        typeof max === 'string' ? max : transformArgumentNumberInfinity(max)
    ];

    if (options?.LIMIT) {
        args.push('LIMIT', options.LIMIT.offset.toString(), options.LIMIT.count.toString());
    }

    return args;
}

export declare function transformReply(): Array<string>;
