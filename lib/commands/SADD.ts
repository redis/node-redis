import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, members: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['SADD', key], members);
}

export declare function transformReply(): number;
