import { RedisCommandArgument, RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    member: RedisCommandArgument | Array<RedisCommandArgument>
): RedisCommandArguments {
    return pushVerdictArguments(['ZMSCORE', key], member);
}

export { transformNumberInfinityNullArrayReply as transformReply } from './generic-transformers';
