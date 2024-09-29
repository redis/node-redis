import { RedisJSON, transformRedisJsonArgument } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, path: string, json: RedisJSON): Array<string> {
    return ['JSON.MERGE', key, path, transformRedisJsonArgument(json)];
}

export declare function transformReply(): 'OK';
