import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushQueryArguments } from '.';

export { FIRST_KEY_INDEX } from './QUERY';

export const IS_READ_ONLY = true;

export function transformArguments(
    graph: RedisCommandArgument,
    query: RedisCommandArgument,
    timeout?: number
): RedisCommandArguments {
    return pushQueryArguments(
        ['GRAPH.RO_QUERY'],
        graph,
        query,
        timeout
    );
}

export { transformReply } from './QUERY';
