import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export function transformArguments(sha1: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['SCRIPT', 'EXISTS'], sha1);
}

export { transformReplyBooleanArray as transformReply } from './generic-transformers';
