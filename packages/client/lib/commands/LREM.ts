import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    count: number,
    element: RedisCommandArgument
): RedisCommandArguments {
    return [
        'LREM',
        key,
        count.toString(),
        element
    ];
}

export declare function transformReply(): number;
