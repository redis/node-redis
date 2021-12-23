import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return ['PERSIST', key];
}

export { transformBooleanReply as transformReply } from './generic-transformers';
