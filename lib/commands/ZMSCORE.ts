import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, member: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['ZMSCORE', key], member);
}

export { transformReplyNumberInfinityNullArray as transformReply } from './generic-transformers';
