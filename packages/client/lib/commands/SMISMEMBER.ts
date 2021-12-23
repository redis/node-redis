import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    members: Array<RedisCommandArgument>
): RedisCommandArguments {
    return ['SMISMEMBER', key, ...members];
}

export { transformBooleanArrayReply as transformReply } from './generic-transformers';
