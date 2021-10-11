export const FIRST_KEY_INDEX = 1;

export function transformArguments(key: string, index: number, element: string): Array<string> {
    return [
        'LSET',
        key,
        index.toString(),
        element
    ];
}

export declare function transformReply(): string;
