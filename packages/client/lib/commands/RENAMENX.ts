import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    newKey: RedisCommandArgument
): RedisCommandArguments {
    return ['RENAMENX', key, newKey];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
