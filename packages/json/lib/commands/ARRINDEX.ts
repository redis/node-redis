import { RedisJSON, transformRedisJsonArgument } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(key: string, path: string, json: RedisJSON, start?: number, stop?: number): Array<string> {
    const args = ['JSON.ARRINDEX', key, path, transformRedisJsonArgument(json)];

    if (start !== undefined && start !== null) {
        args.push(start.toString());

        if (stop !== undefined && stop !== null) {
            args.push(stop.toString());
        }
    }

    return args;
}

export declare function transformReply(): number | Array<number>;
