import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export const IS_READ_ONLY = true;

interface ZUnionOptions {
    WEIGHTS?: Array<number>;
    AGGREGATE?: 'SUM' | 'MIN' | 'MAX';
}

export function transformArguments(
    keys: Array<RedisCommandArgument> | RedisCommandArgument,
    options?: ZUnionOptions
): RedisCommandArguments {
    const args = pushVerdictArgument(['ZUNION'], keys);

    if (options?.WEIGHTS) {
        args.push('WEIGHTS', ...options.WEIGHTS.map(weight => weight.toString()));
    }

    if (options?.AGGREGATE) {
        args.push('AGGREGATE', options.AGGREGATE);
    }

    return args;
}

export declare function transformReply(): Array<RedisCommandArgument>;
