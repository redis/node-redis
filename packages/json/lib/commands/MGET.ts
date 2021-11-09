import { RedisJSON, transformRedisJsonNullReply } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(keys: Array<string>, path: string): Array<string> {
    return [
        'JSON.MGET',
        ...keys,
        path
    ];
}

export function transformReply(reply: Array<string | null>): Array<RedisJSON | null> {
    return reply.map(transformRedisJsonNullReply);
}
