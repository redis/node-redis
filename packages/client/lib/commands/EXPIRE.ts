import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    seconds: number
): RedisCommandArguments {
    return ['EXPIRE', key, seconds.toString()];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
