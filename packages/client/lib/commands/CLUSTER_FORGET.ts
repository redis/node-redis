export function transformArguments(nodeId: string): Array<string> {
    return  ['CLUSTER', 'FORGET', nodeId];
}

export declare function transformReply(): 'OK';
