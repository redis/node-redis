import { RedisCommandArguments } from '.';
import { transformArguments as transformZRankArguments } from './ZRANK';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZRANK';

export function transformArguments(...args: Parameters<typeof transformZRankArguments>): RedisCommandArguments {
    return [
        ...transformZRankArguments(...args),
        'WITHSCORE'
    ];
}

export { transformSortedSetMemberNullReply as transformReply } from './generic-transformers';
