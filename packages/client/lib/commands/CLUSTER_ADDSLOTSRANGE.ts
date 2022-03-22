export function transformArguments(...slots: Array<[startSlot: number, endSlot: number]>): Array<string> {
    const args =  ['CLUSTER', 'DELSLOTSRANGE'];

    for(const [start, end] of slots) {
        args.push(start.toString(), end.toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
