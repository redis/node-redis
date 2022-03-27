export function transformArguments(nodeId: string): Array<string> {
    return ['CLUSTER', 'REPLICATE', nodeId];
}

export declare function transformReply(): 'OK';
