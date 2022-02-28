export function transformArguments(nodeId: string): Array<string> {
    return  ['CLUSTER', 'SLAVES', nodeId];
}

export { transformReply } from './CLUSTER_NODES'
