export function transformArguments(slot: number): Array<string> {
    return ['CLUSTER', 'COUNTKEYSINSLOT', slot.toString()];
}

export declare function transformReply(): number;
