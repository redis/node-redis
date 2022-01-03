import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    count?: number
): RedisCommandArguments {
    const args = ['SPOP', key];

    if (typeof count === 'number') {
        args.push(count.toString());
    }

    return args;
}

export declare function transformReply(): Array<RedisCommandArgument>;
