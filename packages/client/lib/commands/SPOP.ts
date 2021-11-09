export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, count?: number): Array<string> {
    const args = ['SPOP', key];

    if (typeof count === 'number') {
        args.push(count.toString());
    }

    return args;
}

export declare function transformReply(): Array<string>;
