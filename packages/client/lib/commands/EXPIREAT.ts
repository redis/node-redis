import { transformEXAT } from './generic-transformers';

export function transformArguments(key: string, timestamp: number | Date): Array<string> {
    return [
        'EXPIREAT',
        key,
        transformEXAT(timestamp)
    ];
}

export { transformReplyBoolean as transformReply } from './generic-transformers';
