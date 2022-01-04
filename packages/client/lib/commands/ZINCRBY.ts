import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformNumberInfinityArgument } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    increment: number,
    member: RedisCommandArgument
): RedisCommandArguments {
    return [
        'ZINCRBY',
        key,
        transformNumberInfinityArgument(increment),
        member
    ];
}

export { transformNumberInfinityReply as transformReply } from './generic-transformers';
