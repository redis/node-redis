import { RedisCommandArgument, RedisCommandArguments } from '@redis/client/dist/lib/commands/index';
import { pushQueryArguments, QueryOptionsBackwardCompatible } from '.';

export const FIRST_KEY_INDEX = 1;

export function transformArguments(
    graph: RedisCommandArgument,
    query: RedisCommandArgument,
    options?: QueryOptionsBackwardCompatible,
    compact?: boolean
): RedisCommandArguments {
    return pushQueryArguments(
        ['GRAPH.QUERY'],
        graph,
        query,
        options,
        compact
    );
}

type Headers = Array<string>;

type Data = Array<string | number | null | Data>;

type Metadata = Array<string>;

type QueryRawReply = [
    headers: Headers,
    data: Data,
    metadata: Metadata
] | [
    metadata: Metadata
];

export type QueryReply = {
    headers: undefined;
    data: undefined;
    metadata: Metadata;
} | {
    headers: Headers;
    data: Data;
    metadata: Metadata;
};

export function transformReply(reply: QueryRawReply): QueryReply {
    return reply.length === 1 ? {
        headers: undefined,
        data: undefined,
        metadata: reply[0]
    } : {
        headers: reply[0],
        data: reply[1],
        metadata: reply[2]
    };
}
