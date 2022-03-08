import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: RedisCommandArgument,
    destination: RedisCommandArgument
): RedisCommandArguments {
    return ['RPOPLPUSH', source, destination];
}

export declare function transformReply(): RedisCommandArgument | null;
