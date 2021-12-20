import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformArguments as transformZPopMaxArguments } from './ZPOPMAX';

export { FIRST_KEY_INDEX } from './ZPOPMAX';

export function transformArguments(
    key: RedisCommandArgument,
    count: number
): RedisCommandArguments {
    return [
        ...transformZPopMaxArguments(key),
        count.toString()
    ];
}

export { transformSortedSetWithScoresReply as transformReply } from './generic-transformers';
