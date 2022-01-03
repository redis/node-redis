import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformPXAT } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    millisecondsTimestamp: number | Date
): RedisCommandArguments {
    return [
        'PEXPIREAT',
        key,
        transformPXAT(millisecondsTimestamp)
    ];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
