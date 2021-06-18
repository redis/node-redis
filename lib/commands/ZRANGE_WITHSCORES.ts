import { transformReplySortedSetWithScores } from './generic-transformers';
import { transformArguments as transformZRangeArguments } from './ZRANGE';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZRANGE';

export function transformArguments(...args: Parameters<typeof transformZRangeArguments>): Array<string> {
    return [
        ...transformZRangeArguments(...args),
        'WITHSCORES'
    ];
}

export const transformReply = transformReplySortedSetWithScores;
