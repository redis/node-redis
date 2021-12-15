export type Tupels = {
    [item: string]: number;
};

export function transformArguments(key: string, tuples: Tupels): Array<string> {
    const args = ['CMS.INCRBY', key]
    for (const [item, increment] of Object.entries(tuples)) {
        args.push(item, increment.toString());
    }
    
    return args;
}

export declare function transformReply(): Array<number>;
