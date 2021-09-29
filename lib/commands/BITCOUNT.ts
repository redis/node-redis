export const FIRST_KEY_INDEX = 1;

export const IS_READ_ONLY = true;

interface BitCountRange {
    start: number;
    end: number;
}

export function transformArguments(key: string, range?: BitCountRange): Array<string> {
    const args = ['BITCOUNT', key];

    if (range) {
        args.push(
            range.start.toString(),
            range.end.toString()
        );
    }

    return args;
}

export declare function transformReply(): number;
