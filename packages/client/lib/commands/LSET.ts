import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    index: number,
    element: RedisCommandArgument
): RedisCommandArguments {
    return [
        'LSET',
        key,
        index.toString(),
        element
    ];
}

export declare function transformReply(): RedisCommandArgument;
