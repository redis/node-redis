export function transformArguments(slots: number | Array<number>): Array<string> {
    const args =  ['CLUSTER', 'ADDSLOTS'];

    if (typeof slots === 'number') {
        args.push(slots.toString());
    } else {
        args.push(...slots.map(String));
    }

    return args;
}

export declare function transformReply(): string;
