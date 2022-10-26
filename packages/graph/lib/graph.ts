import { RedisClientType } from '@redis/client/dist/lib/client/index';
import { RedisCommandArgument, RedisFunctions, RedisScripts } from '@redis/client/dist/lib/commands';
import { QueryOptions } from './commands';
import { QueryReply } from './commands/QUERY';

interface GraphMetadata {
    labels: Array<string>;
    relationshipTypes: Array<string>;
    propertyKeys: Array<string>;
}

// https://github.com/RedisGraph/RedisGraph/blob/master/src/resultset/formatters/resultset_formatter.h#L20
enum GraphValueTypes {
    UNKNOWN = 0,
    NULL = 1,
    STRING = 2,
    INTEGER = 3,
    BOOLEAN = 4,
    DOUBLE = 5,
    ARRAY = 6,
    EDGE = 7,
    NODE = 8,
    PATH = 9,
    MAP = 10,
    POINT = 11
}

type GraphEntityRawProperties = Array<[
    id: number,
    ...value: GraphRawValue
]>;

type GraphEdgeRawValue = [
    GraphValueTypes.EDGE,
    [
        id: number,
        relationshipTypeId: number,
        sourceId: number,
        destinationId: number,
        properties: GraphEntityRawProperties
    ]
];

type GraphNodeRawValue = [
    GraphValueTypes.NODE,
    [
        id: number,
        labelIds: Array<number>,
        properties: GraphEntityRawProperties
    ]
];

type GraphPathRawValue = [
    GraphValueTypes.PATH,
    [
        nodes: [
            GraphValueTypes.ARRAY,
            Array<GraphNodeRawValue>
        ],
        edges: [
            GraphValueTypes.ARRAY,
            Array<GraphEdgeRawValue>
        ]
    ]
];

type GraphMapRawValue = [
    GraphValueTypes.MAP,
    Array<string | GraphRawValue>
];

type GraphRawValue = [
    GraphValueTypes.NULL,
    null
] | [
    GraphValueTypes.STRING,
    string
] | [
    GraphValueTypes.INTEGER,
    number
] | [
    GraphValueTypes.BOOLEAN,
    string
] | [
    GraphValueTypes.DOUBLE,
    string
] | [
    GraphValueTypes.ARRAY,
    Array<GraphRawValue>
] | GraphEdgeRawValue | GraphNodeRawValue | GraphPathRawValue | GraphMapRawValue | [
    GraphValueTypes.POINT,
    [
        latitude: string,
        longitude: string
    ]
];

type GraphEntityProperties = Record<string, GraphValue>;

interface GraphEdge {
    id: number;
    relationshipType: string;
    sourceId: number;
    destinationId: number;
    properties: GraphEntityProperties;
}

interface GraphNode {
    id: number;
    labels: Array<string>;
    properties: GraphEntityProperties;
}

interface GraphPath {
    nodes: Array<GraphNode>;
    edges: Array<GraphEdge>;
}

type GraphMap = {
    [key: string]: GraphValue;
};

type GraphValue = null | string | number | boolean | Array<GraphValue> | {
} | GraphEdge | GraphNode | GraphPath | GraphMap | {
    latitude: string;
    longitude: string;
};

type GraphReply<T> = Omit<QueryReply, 'headers' | 'data'> & {
    data?: Array<T>;
};

type GraphClientType = RedisClientType<{
    graph: {
        query: typeof import('./commands/QUERY'),
        roQuery: typeof import('./commands/RO_QUERY')
    }
}, RedisFunctions, RedisScripts>;

export default class Graph {
    #client: GraphClientType;
    #name: string;
    #metadata?: GraphMetadata;

    constructor(
        client: GraphClientType,
        name: string
    ) {
        this.#client = client;
        this.#name = name;
    }

    async query<T>(
        query: RedisCommandArgument,
        options?: QueryOptions
    ) {
        return this.#parseReply<T>(
            await this.#client.graph.query(
                this.#name,
                query,
                options,
                true
            )
        );
    }

    async roQuery<T>(
        query: RedisCommandArgument,
        options?: QueryOptions
    ) {
        return this.#parseReply<T>(
            await this.#client.graph.roQuery(
                this.#name,
                query,
                options,
                true
            )
        );
    }

    #setMetadataPromise?: Promise<GraphMetadata>;

    #updateMetadata(): Promise<GraphMetadata> {
        this.#setMetadataPromise ??= this.#setMetadata()
            .finally(() => this.#setMetadataPromise = undefined);
        return this.#setMetadataPromise;
    }

    // DO NOT use directly, use #updateMetadata instead
    async #setMetadata(): Promise<GraphMetadata> {
        const [labels, relationshipTypes, propertyKeys] = await Promise.all([
            this.#client.graph.roQuery(this.#name, 'CALL db.labels()'),
            this.#client.graph.roQuery(this.#name, 'CALL db.relationshipTypes()'),
            this.#client.graph.roQuery(this.#name, 'CALL db.propertyKeys()')
        ]);

        this.#metadata = {
            labels: this.#cleanMetadataArray(labels.data as Array<[string]>),
            relationshipTypes: this.#cleanMetadataArray(relationshipTypes.data as Array<[string]>),
            propertyKeys: this.#cleanMetadataArray(propertyKeys.data as Array<[string]>)
        };

        return this.#metadata;
    }

    #cleanMetadataArray(arr: Array<[string]>): Array<string> {
        return arr.map(([value]) => value);
    }

    #getMetadata<T extends keyof GraphMetadata>(
        key: T,
        id: number
    ): GraphMetadata[T][number] | Promise<GraphMetadata[T][number]> {
        return this.#metadata?.[key][id] ?? this.#getMetadataAsync(key, id);
    }

    // DO NOT use directly, use #getMetadata instead
    async #getMetadataAsync<T extends keyof GraphMetadata>(
        key: T,
        id: number
    ): Promise<GraphMetadata[T][number]> {
        const value = (await this.#updateMetadata())[key][id];
        if (value === undefined) throw new Error(`Cannot find value from ${key}[${id}]`);
        return value;
    }

    async #parseReply<T>(reply: QueryReply): Promise<GraphReply<T>> {
        if (!reply.data) return reply;

        const promises: Array<Promise<unknown>> = [],
            parsed = {
                metadata: reply.metadata,
                data: reply.data!.map((row: any) => {
                    const data: Record<string, GraphValue> = {};
                    for (let i = 0; i < row.length; i++) {
                        data[reply.headers[i][1]] = this.#parseValue(row[i], promises);
                    }

                    return data as unknown as T;
                })
            };

        if (promises.length) await Promise.all(promises);

        return parsed;
    }

    #parseValue([valueType, value]: GraphRawValue, promises: Array<Promise<unknown>>): GraphValue {
        switch (valueType) {
            case GraphValueTypes.NULL:
                return null;

            case GraphValueTypes.STRING:
            case GraphValueTypes.INTEGER:
                return value;

            case GraphValueTypes.BOOLEAN:
                return value === 'true';

            case GraphValueTypes.DOUBLE:
                return parseFloat(value);

            case GraphValueTypes.ARRAY:
                return value.map(x => this.#parseValue(x, promises));

            case GraphValueTypes.EDGE:
                return this.#parseEdge(value, promises);

            case GraphValueTypes.NODE:
                return this.#parseNode(value, promises);

            case GraphValueTypes.PATH:
                return {
                    nodes: value[0][1].map(([, node]) => this.#parseNode(node, promises)),
                    edges: value[1][1].map(([, edge]) => this.#parseEdge(edge, promises))
                };

            case GraphValueTypes.MAP:
                const map: GraphMap = {};
                for (let i = 0; i < value.length; i++) {
                    map[value[i++] as string] = this.#parseValue(value[i] as GraphRawValue, promises);
                }

                return map;

            case GraphValueTypes.POINT:
                return {
                    latitude: parseFloat(value[0]),
                    longitude: parseFloat(value[1])
                };

            default:
                throw new Error(`unknown scalar type: ${valueType}`);
        }
    }

    #parseEdge([
        id,
        relationshipTypeId,
        sourceId,
        destinationId,
        properties
    ]: GraphEdgeRawValue[1], promises: Array<Promise<unknown>>): GraphEdge {
        const edge = {
            id,
            sourceId,
            destinationId,
            properties: this.#parseProperties(properties, promises)
        } as GraphEdge;

        const relationshipType = this.#getMetadata('relationshipTypes', relationshipTypeId);
        if (relationshipType instanceof Promise) {
            promises.push(
                relationshipType.then(value => edge.relationshipType = value)
            );
        } else {
            edge.relationshipType = relationshipType;
        }

        return edge;
    }

    #parseNode([
        id,
        labelIds,
        properties
    ]: GraphNodeRawValue[1], promises: Array<Promise<unknown>>): GraphNode {
        const labels = new Array<string>(labelIds.length);
        for (let i = 0; i < labelIds.length; i++) {
            const value = this.#getMetadata('labels', labelIds[i]);
            if (value instanceof Promise) {
                promises.push(value.then(value => labels[i] = value));
            } else {
                labels[i] = value;
            }
        }

        return {
            id,
            labels,
            properties: this.#parseProperties(properties, promises)
        };
    }

    #parseProperties(raw: GraphEntityRawProperties, promises: Array<Promise<unknown>>): GraphEntityProperties {
        const parsed: GraphEntityProperties = {};
        for (const [id, type, value] of raw) {
            const parsedValue = this.#parseValue([type, value] as GraphRawValue, promises),
                key = this.#getMetadata('propertyKeys', id);
            if (key instanceof Promise) {
                promises.push(key.then(key => parsed[key] = parsedValue));
            } else {
                parsed[key] = parsedValue;
            }
        }

        return parsed;
    }
}
