export const FIRST_KEY_INDEX = 1;

type LInsertPosition = 'BEFORE' | 'AFTER';

export function transformArguments(
    key: string,
    position: LInsertPosition,
    pivot: string,
    element: string
): Array<string> {
    return [
        'LINSERT',
        key,
        position,
        pivot,
        element
    ];
}

export declare function transformReply(): number;
