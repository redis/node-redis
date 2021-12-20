import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    milliseconds: number
): RedisCommandArguments {
    return ['PEXPIRE', key, milliseconds.toString()];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
