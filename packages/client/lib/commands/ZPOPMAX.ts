import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return [
        'ZPOPMAX',
        key
    ];
}

export { transformSortedSetMemberNullReply as transformReply } from './generic-transformers';
