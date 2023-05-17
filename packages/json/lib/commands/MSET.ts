import { RedisJSON, transformRedisJsonArgument } from '.';

export const FIRST_KEY_INDEX = 1;

export interface KeyPathValue {
    key: string;
    path: string;
    value: RedisJSON;
}

export function transformArguments(keyPathValues: Array<KeyPathValue>): Array<string> {
    if (keyPathValues.length === 0) {
        throw new Error('ERR wrong number of arguments for \'MSET\' command');
    }

    const args: string[] = ['JSON.MSET'];

    keyPathValues.forEach(({ key, path, value }) => {
        args.push(key, path, transformRedisJsonArgument(value));
    });

    return args;
}

export declare function transformReply(): 'OK' | null;