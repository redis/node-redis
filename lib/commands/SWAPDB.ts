export function transformArguments(index1: number, index2: number): Array<string> {
    return ['SWAPDB', index1.toString(), index2.toString()];
}

export declare function transformReply(): string;
