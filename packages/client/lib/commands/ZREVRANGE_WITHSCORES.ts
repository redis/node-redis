import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformStringNumberInfinityArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    min: RedisCommandArgument | number,
    max: RedisCommandArgument | number
): RedisCommandArguments {
    const args = [
        'ZREVRANGE',
        key,
        transformStringNumberInfinityArgument(min),
        transformStringNumberInfinityArgument(max),
        'WITHSCORES'
    ];

    return args;
}

export { transformSortedSetWithScoresReply as transformReply } from './generic-transformers';