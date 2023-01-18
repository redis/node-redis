import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export const TRANSFORM_LEGACY_REPLY = true;

export function transformArguments(key: RedisCommandArgument): RedisCommandArguments {
    return ['HGETALL', key];
}

export { transformTuplesReply as transformReply } from './generic-transformers';
