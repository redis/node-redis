import { RedisCommandArguments } from '.';
import { pushVerdictArguments } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, fields: string | Array<string>): RedisCommandArguments {
    return pushVerdictArguments(['HMGET', key], fields);
}

export declare function transformReply(): Array<string>;
