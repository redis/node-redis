export function transformArguments(nodeId: string): Array<string> {
    return ['CLUSTER', 'COUNT-FAILURE-REPORTS', nodeId];
}

export declare function transformReply(): number;
