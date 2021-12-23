import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    value: RedisCommandArgument
): RedisCommandArguments {
    return ['SETNX', key, value];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
