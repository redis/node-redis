export const FIRST_KEY_INDEX = 2;

export function transformArguments(key: string, group: string, consumer: string): Array<string> {
    return ['XGROUP', 'CREATECONSUMER', key, group, consumer];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
