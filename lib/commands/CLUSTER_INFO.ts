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

export function transformReply(reply: string): ClusterInfoReply {
    const lines = reply.split('\r\n');

    return {
        state: extractLineValue(lines[0]),
        slots: {
            assigned: Number(extractLineValue(lines[1])),
            ok: Number(extractLineValue(lines[2])),
            pfail: Number(extractLineValue(lines[3])),
            fail: Number(extractLineValue(lines[4]))
        },
        knownNodes: Number(extractLineValue(lines[5])),
        size: Number(extractLineValue(lines[6])),
        currentEpoch: Number(extractLineValue(lines[7])),
        myEpoch: Number(extractLineValue(lines[8])),
        stats: {
            messagesSent: Number(extractLineValue(lines[9])),
            messagesReceived: Number(extractLineValue(lines[10]))
        }
    };
}

export function extractLineValue(line: string): string {
    return line.substring(line.indexOf(':') + 1);
}
