import { transformReplySortedSetWithScores } from './generic-transformers';
import { transformArguments as transformZPopMinArguments } from './ZPOPMIN';

export { FIRST_KEY_INDEX } from './ZPOPMIN';

export function transformArguments(key: string, count: number): Array<string> {
    return [
        ...transformZPopMinArguments(key),
        count.toString()
    ];
}

export const transformReply = transformReplySortedSetWithScores;
