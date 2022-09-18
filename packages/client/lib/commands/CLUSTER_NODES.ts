export function transformArguments(): Array<string> {
    return ['CLUSTER', 'NODES'];
}

export enum RedisClusterNodeLinkStates {
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected'
}

interface RedisClusterNodeAddress {
    host: string;
    port: number;
    cport: number | null;
}

export interface RedisClusterReplicaNode extends RedisClusterNodeAddress {
    id: string;
    address: string;
    flags: Array<string>;
    pingSent: number;
    pongRecv: number;
    configEpoch: number;
    linkState: RedisClusterNodeLinkStates;
}

export interface RedisClusterMasterNode extends RedisClusterReplicaNode {
    slots: Array<{
        from: number;
        to: number;
    }>;
    replicas: Array<RedisClusterReplicaNode>;
}

export function transformReply(reply: string): Array<RedisClusterMasterNode> {
    const lines = reply.split('\n');
    lines.pop(); // last line is empty

    const mastersMap = new Map<string, RedisClusterMasterNode>(),
        replicasMap = new Map<string, Array<RedisClusterReplicaNode>>();

    for (const line of lines) {
        const [id, address, flags, masterId, pingSent, pongRecv, configEpoch, linkState, ...slots] = line.split(' '),
            node = {
                id,
                address,
                ...transformNodeAddress(address),
                flags: flags.split(','),
                pingSent: Number(pingSent),
                pongRecv: Number(pongRecv),
                configEpoch: Number(configEpoch),
                linkState: (linkState as RedisClusterNodeLinkStates)
            };

        if (masterId === '-') {
            let replicas = replicasMap.get(id);
            if (!replicas) {
                replicas = [];
                replicasMap.set(id, replicas);
            }

            mastersMap.set(id, {
                ...node,
                slots: slots.map(slot => {
                    // TODO: importing & exporting (https://redis.io/commands/cluster-nodes#special-slot-entries)
                    const [fromString, toString] = slot.split('-', 2),
                        from = Number(fromString);
                    return {
                        from,
                        to: toString ? Number(toString) : from
                    };
                }),
                replicas
            });
        } else {
            const replicas = replicasMap.get(masterId);
            if (!replicas) {
                replicasMap.set(masterId, [node]);
            } else {
                replicas.push(node);
            }
        }
    }

    return [...mastersMap.values()];
}

function transformNodeAddress(address: string): RedisClusterNodeAddress {
    const indexOfColon = address.lastIndexOf(':'),
        indexOfAt = address.indexOf('@', indexOfColon),
        host = address.substring(0, indexOfColon);

    if (indexOfAt === -1) {
        return {
            host,
            port: Number(address.substring(indexOfColon + 1)),
            cport: null
        };
    }

    return {
        host: address.substring(0, indexOfColon),
        port: Number(address.substring(indexOfColon + 1, indexOfAt)),
        cport: Number(address.substring(indexOfAt + 1))
    };
}
