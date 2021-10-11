import { RedisCommandArguments } from '.';
import { transformReplySortedSetWithScores } from './generic-transformers';
import { transformArguments as transformZUnionArguments } from './ZUNION';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZUNION';

export function transformArguments(...args: Parameters<typeof transformZUnionArguments>): RedisCommandArguments {
    return [
        ...transformZUnionArguments(...args),
        'WITHSCORES'
    ];
}

export const transformReply = transformReplySortedSetWithScores;
