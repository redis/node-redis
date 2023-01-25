import { RedisCommandArguments } from '.';

export function transformArguments(): RedisCommandArguments {
    return ['CLUSTER', 'SLOTS'];
}

type ClusterSlotsRawNode = [ip: string, port: number, id: string];

type ClusterSlotsRawReply = Array<[
    from: number,
    to: number,
    master: ClusterSlotsRawNode,
    ...replicas: Array<ClusterSlotsRawNode>
]>;

export interface ClusterSlotsNode {
    ip: string;
    port: number;
    id: string;
};

export type ClusterSlotsReply = Array<{
    from: number;
    to: number;
    master: ClusterSlotsNode;
    replicas: Array<ClusterSlotsNode>;
}>;

export function transformReply(reply: ClusterSlotsRawReply): ClusterSlotsReply {
    return reply.map(([from, to, master, ...replicas]) => {
        return {
            from,
            to,
            master: transformNode(master),
            replicas: replicas.map(transformNode)
        };
    });
}

function transformNode([ip, port, id]: ClusterSlotsRawNode): ClusterSlotsNode {
    return {
        ip,
        port,
        id
    };
}
