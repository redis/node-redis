import { RedisCommandArguments } from '.';
import { pushVariadicArguments } from './generic-transformers';

export function transformArguments(sha1: string | Array<string>): RedisCommandArguments {
    return pushVariadicArguments(['SCRIPT', 'EXISTS'], sha1);
}

export { transformBooleanArrayReply as transformReply } from './generic-transformers';
