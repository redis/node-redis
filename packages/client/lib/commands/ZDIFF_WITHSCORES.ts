import { RedisCommandArguments } from '.';
import { transformArguments as transformZDiffArguments } from './ZDIFF';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZDIFF';

export function transformArguments(...args: Parameters<typeof transformZDiffArguments>): RedisCommandArguments {
    return [
        ...transformZDiffArguments(...args),
        'WITHSCORES'
    ];
}

export { transformSortedSetWithScoresReply as transformReply } from './generic-transformers';
