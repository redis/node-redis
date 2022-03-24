export function transformArguments(): Array<string> {
    return ['CLUSTER', 'LINKS'];
}

type ClusterLinksRawReply = Array<[
    'direction',
    string,
    'node',
    string,
    'createTime',
    number,
    'events',
    string,
    'send-buffer-allocated',
    number,
    'send-buffer-used',
    number
]>;

type ClusterLinksReply = Array<{
    direction: string;
    node: string;
    createTime: number;
    events: string;
    sendBufferAllocated: number;
    sendBufferUsed: number;
}>;

export function transformReply(reply: ClusterLinksRawReply): ClusterLinksReply {
    return reply.map(peerLink => ({
        direction: peerLink[1],
        node: peerLink[3],
        createTime: Number(peerLink[5]),
        events: peerLink[7],
        sendBufferAllocated: Number(peerLink[9]),
        sendBufferUsed: Number(peerLink[11])
    }));
}
