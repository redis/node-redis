import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    values: Array<number>
): RedisCommandArguments {
    const args = ['TDIGEST.REVRANK', key];
    for (const item of values) {
        args.push(item.toString());
    }

    return args;
}

export declare function transformReply(): Array<number>;
