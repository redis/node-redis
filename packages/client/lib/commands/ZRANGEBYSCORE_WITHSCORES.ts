import { RedisCommandArguments } from '.';
import { ZRangeByScoreOptions, transformArguments as transformZRangeByScoreArguments } from './ZRANGEBYSCORE';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZRANGEBYSCORE';

export function transformArguments(
    key: string,
    min: number | string,
    max: number | string,
    options?: ZRangeByScoreOptions
): RedisCommandArguments {
    return [
        ...transformZRangeByScoreArguments(key, min, max, options),
        'WITHSCORES'
    ];
}

export { transformReplySortedSetWithScores as transformReply } from './generic-transformers';
