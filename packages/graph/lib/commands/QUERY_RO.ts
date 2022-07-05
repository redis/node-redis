import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushTimeoutArgument } from '.';

export { FIRST_KEY_INDEX } from './QUERY';

export const IS_READ_ONLY = true;

export function transformArguments(
    key: RedisCommandArgument,
    query: RedisCommandArgument,
    timeout?: number
): RedisCommandArguments {
    return pushTimeoutArgument(
        ['GRAPH.QUERY_RO', key, query],
        timeout
    );
}

export { transformReply } from './QUERY';
