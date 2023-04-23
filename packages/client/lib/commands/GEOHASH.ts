import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVariadicArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    member: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVariadicArguments(['GEOHASH', key], member);
}

export declare function transformReply(): Array<RedisCommandArgument>;
