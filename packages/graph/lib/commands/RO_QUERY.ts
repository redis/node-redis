import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands';
import { pushQueryArguments, QueryOptionsBackwardCompatible } from '.';

export { FIRST_KEY_INDEX } from './QUERY';

export const IS_READ_ONLY = true;

export function transformArguments(
    graph: RedisCommandArgument,
    query: RedisCommandArgument,
    options?: QueryOptionsBackwardCompatible,
    compact?: boolean
): RedisCommandArguments {
    return pushQueryArguments(
        ['GRAPH.RO_QUERY'],
        graph,
        query,
        options,
        compact
    );
}

export { transformReply } from './QUERY';
