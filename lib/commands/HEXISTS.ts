export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, field: string): Array<string> {
    return ['HEXISTS', key, field];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
