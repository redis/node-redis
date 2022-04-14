export enum ClusterSlotStates {
    IMPORTING = 'IMPORTING',
    MIGRATING = 'MIGRATING',
    STABLE = 'STABLE',
    NODE = 'NODE'
}

export function transformArguments(
    slot: number,
    state: ClusterSlotStates,
    nodeId?: string
): Array<string> {
    const args = ['CLUSTER', 'SETSLOT', slot.toString(), state];

    if (nodeId) {
        args.push(nodeId);
    }

    return args;
}

export declare function transformReply(): 'OK';
