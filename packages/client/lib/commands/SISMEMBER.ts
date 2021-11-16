export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, member: string): Array<string> {
    return ['SISMEMBER', key, member];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
