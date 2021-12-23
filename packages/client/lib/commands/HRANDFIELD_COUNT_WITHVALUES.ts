import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformArguments as transformHRandFieldCountArguments } from './HRANDFIELD_COUNT';

export { FIRST_KEY_INDEX, IS_READ_ONLY } from './HRANDFIELD_COUNT';

export function transformArguments(
    key: RedisCommandArgument,
    count: number
): RedisCommandArguments {
    return [
        ...transformHRandFieldCountArguments(key, count),
        'WITHVALUES'
    ];
}

export { transformTuplesReply as transformReply } from './generic-transformers';
