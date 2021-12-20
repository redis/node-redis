import { RedisCommandArgument, RedisCommandArguments } from '.';
import { ZRangeByScoreOptions, transformArguments as transformZRangeByScoreArguments } from './ZRANGEBYSCORE';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZRANGEBYSCORE';

export function transformArguments(
    key: RedisCommandArgument,
    min: string | number,
    max: string | number,
    options?: ZRangeByScoreOptions
): RedisCommandArguments {
    return [
        ...transformZRangeByScoreArguments(key, min, max, options),
        'WITHSCORES'
    ];
}

export { transformSortedSetWithScoresReply as transformReply } from './generic-transformers';
