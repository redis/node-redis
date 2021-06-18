import { transformReplySortedSetWithScores } from './generic-transformers';
import { transformArguments as transformZInterArguments } from './ZINTER';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './ZINTER';

export function transformArguments(...args: Parameters<typeof transformZInterArguments>): Array<string> {
    return [
        ...transformZInterArguments(...args),
        'WITHSCORES'
    ];
}

export const transformReply = transformReplySortedSetWithScores;
