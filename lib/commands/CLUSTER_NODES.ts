export function transformArguments(): Array<string> {
    return ['CLUSTER', 'NODES'];
}

export enum RedisClusterNodeLinkStates {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected'
}

export interface RedisClusterNode {
    id: string;
    url: string;
    flags: Array<string>,
    master: string | null;
    pingSent: number;
    pongRecv: number;
    configEpoch: number;
    linkState: RedisClusterNodeLinkStates;
    slots: Array<{
        from: number,
        to: number
    }>
}

export function transformReply(reply: string): Array<RedisClusterNode> {
    const lines = reply.split('\n');
    lines.pop(); // last line is empty
    return lines.map(line => {
        const [id, url, flags, master, pingSent, pongRecv, configEpoch, linkState, ...slots] = line.split(' ');
        return {
            id,
            url,
            flags: flags.split(','),
            master: master === '-' ? null : master,
            pingSent: Number(pingSent),
            pongRecv: Number(pongRecv),
            configEpoch: Number(configEpoch),
            linkState: (linkState as RedisClusterNodeLinkStates),
            slots: slots.map(slot => {
                // TODO: importing & exporting (https://redis.io/commands/cluster-nodes#special-slot-entries)
                const [fromString, toString] = slot.split('-', 2),
                    from = Number(fromString);
                return {
                    from,
                    to: toString ? Number(toString) : from
                };
            })
        };
    });
}
