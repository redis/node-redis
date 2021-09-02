import { transformReplyNumber } from './generic-transformers';

export const FIRST_KEY_INDEX = 2;

export function transformArguments(key: string, group: string, consumer: string): Array<string> {
    return ['XGROUP', 'DELCONSUMER', key, group, consumer];
}

export const transformReply = transformReplyNumber;
