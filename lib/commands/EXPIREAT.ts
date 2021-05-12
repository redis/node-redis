import { transformReplyBoolean } from './generic-transformers';

export function transformArguments(key: string, timestamp: Date | number): Array<string> {
    return [
        'EXPIREAT',
        key,
        (timestamp instanceof Date ? timestamp.getTime() : timestamp).toString()
    ];
}

export const transformReply = transformReplyBoolean;
