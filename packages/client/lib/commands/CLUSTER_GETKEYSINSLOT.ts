export function transformArguments(slot: number, count: number): Array<string> {
    return ['CLUSTER', 'GETKEYSINSLOT', slot.toString(), count.toString()];
}

export declare function transformReply(): Array<string>;
