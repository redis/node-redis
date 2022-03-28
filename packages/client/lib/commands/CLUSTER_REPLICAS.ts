export function transformArguments(nodeId: string): Array<string> {
    return ['CLUSTER', 'REPLICAS', nodeId];
}

export { transformReply } from './CLUSTER_NODES';
