import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushTimeoutArgument } from '.';

export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    query: RedisCommandArgument,
    timeout?: number
): RedisCommandArguments {
    return pushTimeoutArgument(
        ['GRAPH.PROFILE', key, query],
        timeout
    );
}

export declare function transfromReply(): Array<RedisCommandArgument>;
