export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, value: string): Array<string> {
    return ['SETNX', key, value];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
