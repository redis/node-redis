export const FIRST_KEY_INDEX = 1;

type Tupels = {
    [item: number]: number;
};

export function transformArguments(key: string, tuples: Tupels): Array<string> {
    const args = ['TDIGEST.ADD', key];
    for (const [val, weight] of Object.entries(tuples)) {
        args.push(val, weight.toString());
    }

    return args;
}

export declare function transformReply(): 'OK';
