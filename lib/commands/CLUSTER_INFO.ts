export function transformArguments(): Array<string> {
    return ['CLUSTER', 'INFO'];
}

interface ClusterInfoReply {
    state: string;
    slots: {
        assigned: number;
        ok: number;
        pfail: number;
        fail: number;
    };
    knownNodes: number;
    size: number;
    currentEpoch: number;
    myEpoch: number;
    stats: {
        messagesSent: number;
        messagesReceived: number;
    };
}

const regex = /.*:(?<value>.*)(\n?)/g;

export function transformReply(reply: string): ClusterInfoReply {
    const iterator = reply.matchAll(regex);

    return {
        state: iterator.next().value[1],
        slots: {
            assigned: Number(iterator.next().value[1]),
            ok: Number(iterator.next().value[1]),
            pfail: Number(iterator.next().value[1]),
            fail: Number(iterator.next().value[1])
        },
        knownNodes: Number(iterator.next().value[1]),
        size: Number(iterator.next().value[1]),
        currentEpoch: Number(iterator.next().value[1]),
        myEpoch: Number(iterator.next().value[1]),
        stats: {
            messagesSent: Number(iterator.next().value[1]),
            messagesReceived: Number(iterator.next().value[1])
        }
    };
}
