import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

type LInsertPosition = 'BEFORE' | 'AFTER';

export function transformArguments(
    key: RedisCommandArgument,
    position: LInsertPosition,
    pivot: RedisCommandArgument,
    element: RedisCommandArgument
): RedisCommandArguments {
    return [
        'LINSERT',
        key,
        position,
        pivot,
        element
    ];
}

export declare function transformReply(): number;
