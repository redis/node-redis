export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string): Array<string> {
    return ['HGETALL', key];
}

export { transformReplyTuples as transformReply } from './generic-transformers';
