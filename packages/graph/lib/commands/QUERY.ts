import { RedisCommandArgument, RedisCommandArguments } from '@node-redis/client/dist/lib/commands/index';
import { pushQueryArguments } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    graph: RedisCommandArgument,
    query: RedisCommandArgument,
    timeout?: number
): RedisCommandArguments {
    return pushQueryArguments(
        ['GRAPH.QUERY'],
        graph,
        query,
        timeout
    );
}

type Headers = Array<string>;

type Data = Array<Array<string | number | null>>;

type Metadata = Array<string>;

type QueryRawReply = [
    headers: Headers,
    data: Data,
    metadata: Metadata
];

interface QueryReply {
    headers: Headers,
    data: Data,
    metadata: Metadata
};

export function transformReply(reply: QueryRawReply): QueryReply {
    return {
        headers: reply[0],
        data: reply[1],
        metadata: reply[2]
    };
}
