import { transformReplyBoolean } from './generic-transformers';

export function transformArguments(key: string, timestamp: number | Date): Array<string> {
    return [
        'EXPIREAT',
        key,
        (typeof timestamp === 'number' ? timestamp : Math.floor(timestamp.getTime() / 1000)).toString()
    ];
}

export const transformReply = transformReplyBoolean;
