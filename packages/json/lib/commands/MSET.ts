import { RedisJSON, transformRedisJsonArgument} from '.';
import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export interface KeyPathValue {
    key: RedisCommandArgument;
    path: string;
    value: RedisJSON;
}

export function transformArguments(keyPathValues: Array<KeyPathValue>): RedisCommandArguments {
    const args: RedisCommandArguments = ['JSON.MSET'];

    keyPathValues.forEach(({ key, path, value }) => {
        args.push(key, path, transformRedisJsonArgument(value));
    });

    return args;
}

export declare function transformReply(): 'OK';
