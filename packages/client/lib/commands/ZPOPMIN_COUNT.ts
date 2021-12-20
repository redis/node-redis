import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformArguments as transformZPopMinArguments } from './ZPOPMIN';

export { FIRST_KEY_INDEX } from './ZPOPMIN';

export function transformArguments(
    key: RedisCommandArgument,
    count: number
): RedisCommandArguments {
    return [
        ...transformZPopMinArguments(key),
        count.toString()
    ];
}

export { transformSortedSetWithScoresReply as transformReply } from './generic-transformers';
