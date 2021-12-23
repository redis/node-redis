import { RedisCommandArgument, RedisCommandArguments } from '.';
import { transformEXAT } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    timestamp: number | Date
): RedisCommandArguments {
    return [
        'EXPIREAT',
        key,
        transformEXAT(timestamp)
    ];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
