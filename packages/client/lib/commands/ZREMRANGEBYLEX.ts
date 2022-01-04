import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformStringNumberInfinityArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    min: RedisCommandArgument | number,
    max: RedisCommandArgument | number
): RedisCommandArguments {
    return [
        'ZREMRANGEBYLEX',
        key,
        transformStringNumberInfinityArgument(min),
        transformStringNumberInfinityArgument(max)
    ];
}

export declare function transformReply(): number;
