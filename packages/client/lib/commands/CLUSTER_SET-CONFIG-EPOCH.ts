export function transformArguments(configEpoch: number): Array<string> {
    return  ['CLUSTER', 'SET-CONFIG-EPOCH', configEpoch.toString()];
}

export declare function transformReply(): 'OK';
