import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    key: RedisCommandArgument,
    milliseconds: number,
    value: RedisCommandArgument
): RedisCommandArguments {
    return [
        'PSETEX',
        key,
        milliseconds.toString(),
        value
    ];
}

export declare function transformReply(): RedisCommandArgument;
