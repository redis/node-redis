import { RedisCommandArgument } from '@node-redis/client/dist/lib/commands';
import { RedisCommandArguments } from '@node-redis/client/dist/lib/commands';

export function transformArguments(
    graph: RedisCommandArgument,
    query: RedisCommandArgument,
    timeout?: number
): RedisCommandArguments {
    const args = ['GRAPH.QUERY', graph, query];

    if (timeout) {
        args.push(timeout.toString());
    }

    return args;
}

