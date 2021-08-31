import { transformEXAT, transformReplyBoolean } from './generic-transformers';

export function transformArguments(key: string, timestamp: number | Date): Array<string> {
    return [
        'EXPIREAT',
        key,
        transformEXAT(timestamp)
    ];
}

export const transformReply = transformReplyBoolean;
