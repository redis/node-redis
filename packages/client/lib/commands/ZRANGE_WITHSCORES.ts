import { RedisCommandArguments } from '.';
import { transformArguments as transformZRangeArguments } from './ZRANGE';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZRANGE';

export function transformArguments(...args: Parameters<typeof transformZRangeArguments>): RedisCommandArguments {
    return [
        ...transformZRangeArguments(...args),
        'WITHSCORES'
    ];
}

export { transformSortedSetWithScoresReply as transformReply } from './generic-transformers';
