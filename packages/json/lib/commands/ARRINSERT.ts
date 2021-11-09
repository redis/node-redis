import { RedisJSON, transformRedisJsonArgument } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, path: string, index: number, ...jsons: Array<RedisJSON>): Array<string> {
    const args = ['JSON.ARRINSERT', key, path, index.toString()];

    for (const json of jsons) {
        args.push(transformRedisJsonArgument(json));
    }

    return args;
}

export declare function transformReply(): number | Array<number>;
