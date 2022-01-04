import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 2;

export function transformArguments(
    key: RedisCommandArgument,
    group: RedisCommandArgument
): RedisCommandArguments {
    return ['XGROUP', 'DESTROY', key, group];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
