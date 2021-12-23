import { RedisCommandArgument, RedisCommandArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    source: RedisCommandArgument,
    destination: RedisCommandArgument,
    timeout: number
): RedisCommandArguments {
    return ['BRPOPLPUSH', source, destination, timeout.toString()];
}

export declare function transformReply(): RedisCommandArgument | null;
