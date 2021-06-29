import { transformReplyBoolean } from './generic-transformers';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, field: string, value: string): Array<string> {
    return ['HSETNX', key, field, value];
}

export const transformReply = transformReplyBoolean;
