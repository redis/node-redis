import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    member: RedisCommandArgument
): RedisCommandArguments {
    return ['SISMEMBER', key, member];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
