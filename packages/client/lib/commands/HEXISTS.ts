import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    field: RedisCommandArgument
): RedisCommandArguments {
    return ['HEXISTS', key, field];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
