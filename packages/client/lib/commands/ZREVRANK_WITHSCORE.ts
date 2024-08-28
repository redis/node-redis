import { RedisCommandArguments } from '.';
import { transformArguments as transformZRevRankArguments } from './ZREVRANK';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZREVRANK';

export function transformArguments(...args: Parameters<typeof transformZRevRankArguments>): RedisCommandArguments {
    return [
        ...transformZRevRankArguments(...args),
        'WITHSCORE'
    ];
}

export { transformSortedSetMemberNullReply as transformReply } from './generic-transformers';
